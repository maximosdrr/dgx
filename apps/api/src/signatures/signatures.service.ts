import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { createHash, createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { DocumentStatus, UserPayload } from '@docgen/shared';
import { BiometricSignature } from '../common/entities/biometric-signature.entity';
import { Document, SignatureStatus, SignatureType } from '../common/entities/document.entity';
import { Template } from '../common/entities/template.entity';
import { User } from '../common/entities/user.entity';
import { PdfService } from '../pdf/pdf.service';
import { S3Service } from '../storage/s3.service';
import { CreateFacialSignatureDto } from './dto/create-facial-signature.dto';
import { CreateWrittenSignatureDto } from './dto/create-written-signature.dto';
import { SaveSignaturesBatchDto, SignatureSlotDto } from './dto/save-signatures-batch.dto';

export interface SignatureResult {
  signatureId: string;
  documentId: string;
  signedAt: string;
  signatureType: SignatureType;
  signatureStatus: SignatureStatus;
  presignedUrl: string;
  expiresAt: Date;
  faceImageHash?: string;
  signatureImageHash?: string;
  signatureKey?: string;
}

@Injectable()
export class SignaturesService {
  constructor(
    private readonly em: EntityManager,
    private readonly config: ConfigService,
    private readonly pdfService: PdfService,
    private readonly s3Service: S3Service,
  ) {}

  async saveBatch(
    dto: SaveSignaturesBatchDto,
    user: UserPayload,
    ipAddress?: string,
  ): Promise<SignatureResult & { signatures: Record<string, unknown>[] }> {
    if (!dto.signatures.length) {
      throw new BadRequestException('At least one signature is required');
    }

    const em = this.em.fork();
    const document = await this.getSignableDocument(em, dto.documentId, user);
    const signedAt = new Date();
    const processed: Record<string, unknown>[] = [];

    for (const slot of dto.signatures) {
      if (slot.type === 'WRITTEN') {
        processed.push(await this.processWrittenSlot(slot, user, document, signedAt));
      } else {
        processed.push(await this.processFacialSlot(em, slot, user, document, signedAt, ipAddress));
      }
    }

    const primaryType = dto.signatures.some((slot) => slot.type === 'FACIAL') ? 'FACIAL' : 'WRITTEN';
    const firstSignatureId = String(processed[0].signatureId);
    const { url, expiresAt } = await this.finalizeSignedDocument({
      em,
      document,
      signatureType: primaryType,
      signedAt,
      ipAddress,
      signatureData: { signatures: processed },
      logHtml: this.renderBatchSignatureLog(processed, signedAt, ipAddress),
    });

    return {
      signatureId: firstSignatureId,
      documentId: document.id,
      signedAt: signedAt.toISOString(),
      signatureType: primaryType,
      signatureStatus: 'SIGNED',
      presignedUrl: url,
      expiresAt,
      signatures: processed,
    };
  }

  async createWrittenSignature(
    dto: CreateWrittenSignatureDto,
    user: UserPayload,
    ipAddress?: string,
  ): Promise<SignatureResult> {
    const em = this.em.fork();
    const document = await this.getSignableDocument(em, dto.documentId, user);
    const imageBuffer = this.decodeBase64Image(dto.signatureImageBase64, 'Signature image');
    const signatureImageHash = createHash('sha256').update(imageBuffer).digest('hex');
    const signatureId = uuidv4();
    const signedAt = new Date();
    const signatureImageKey = `signatures/${user.sub}/${document.id}/${signatureId}.png`;

    await this.s3Service.uploadFile(signatureImageKey, imageBuffer, 'image/png');

    const signatureData = {
      signatureId,
      signerName: dto.signerName.trim(),
      signatureImageKey,
      signatureImageHash,
    };

    const { url, expiresAt } = await this.finalizeSignedDocument({
      em,
      document,
      signatureType: 'WRITTEN',
      signedAt,
      ipAddress,
      signatureData,
      logHtml: this.renderWrittenSignatureLog({
        signerName: signatureData.signerName,
        signedAt,
        ipAddress,
        signatureImageBase64: dto.signatureImageBase64,
        signatureImageHash,
        signatureId,
      }),
    });

    return {
      signatureId,
      documentId: document.id,
      signedAt: signedAt.toISOString(),
      signatureType: 'WRITTEN',
      signatureStatus: 'SIGNED',
      signatureImageHash,
      presignedUrl: url,
      expiresAt,
    };
  }

  async createFacialSignature(
    dto: CreateFacialSignatureDto,
    user: UserPayload,
    ipAddress?: string,
  ): Promise<SignatureResult> {
    const em = this.em.fork();
    const document = await this.getSignableDocument(em, dto.documentId, user);

    const faceImage = this.decodeBase64Image(dto.faceImageBase64, 'Face image');
    const faceImageHash = createHash('sha256').update(faceImage).digest('hex');
    const signatureId = uuidv4();
    const signedAt = new Date();
    const signerDocument = dto.signerDocument.replace(/\D/g, '');

    const payload = {
      signatureId,
      documentId: document.id,
      userId: user.sub,
      signedAt: signedAt.toISOString(),
      ipAddress: ipAddress ?? '',
      signerName: dto.signerName.trim(),
      signerDocument,
      faceImageHash,
    };

    const secret = this.config.get<string>('BIOMETRIC_SIGNATURE_SECRET')
      ?? this.config.getOrThrow<string>('JWT_SECRET');
    const signatureKey = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const signature = em.create(BiometricSignature, {
      id: signatureId,
      user: em.getReference(User, user.sub),
      document,
      signerName: payload.signerName,
      signerDocument,
      faceImageHash,
      signatureKey,
      ipAddress,
      signedAt,
    });

    em.persist(signature);

    const signatureData = {
      signatureId,
      signerName: payload.signerName,
      signerDocument,
      faceImageHash,
      signatureKey,
    };

    const { url, expiresAt } = await this.finalizeSignedDocument({
      em,
      document,
      signatureType: 'FACIAL',
      signedAt,
      ipAddress,
      signatureData,
      logHtml: this.renderFacialSignatureLog({
        signerName: payload.signerName,
        signerDocument,
        signedAt,
        ipAddress,
        signatureId,
        faceImageHash,
        signatureKey,
      }),
    });

    return {
      signatureId,
      documentId: document.id,
      signedAt: signedAt.toISOString(),
      signatureType: 'FACIAL',
      signatureStatus: 'SIGNED',
      faceImageHash,
      signatureKey,
      presignedUrl: url,
      expiresAt,
    };
  }

  private async processWrittenSlot(
    slot: SignatureSlotDto,
    user: UserPayload,
    document: Document,
    signedAt: Date,
  ): Promise<Record<string, unknown>> {
    if (!slot.signatureImageBase64 && slot.signatureImageKey) {
      return {
        signatureId: slot.signatureId ?? uuidv4(),
        slotId: slot.slotId,
        label: slot.label,
        type: 'WRITTEN',
        signerName: slot.signerName.trim(),
        signatureImageKey: slot.signatureImageKey,
        signatureImageHash: slot.signatureImageHash,
        signedAt: signedAt.toISOString(),
      };
    }

    if (!slot.signatureImageBase64) {
      throw new BadRequestException(`Missing written signature image for slot ${slot.slotId}`);
    }

    const imageBuffer = this.decodeBase64Image(slot.signatureImageBase64, 'Signature image');
    const signatureImageHash = createHash('sha256').update(imageBuffer).digest('hex');
    const signatureId = uuidv4();
    const signatureImageKey = `signatures/${user.sub}/${document.id}/${signatureId}.png`;
    await this.s3Service.uploadFile(signatureImageKey, imageBuffer, 'image/png');

    return {
      signatureId,
      slotId: slot.slotId,
      label: slot.label,
      type: 'WRITTEN',
      signerName: slot.signerName.trim(),
      signatureImageKey,
      signatureImageHash,
      signedAt: signedAt.toISOString(),
    };
  }

  private async processFacialSlot(
    em: EntityManager,
    slot: SignatureSlotDto,
    user: UserPayload,
    document: Document,
    signedAt: Date,
    ipAddress?: string,
  ): Promise<Record<string, unknown>> {
    if (!slot.faceImageBase64 && slot.signatureKey) {
      return {
        signatureId: slot.signatureId ?? uuidv4(),
        slotId: slot.slotId,
        label: slot.label,
        type: 'FACIAL',
        signerName: slot.signerName.trim(),
        signerDocument: slot.signerDocument,
        faceImageHash: slot.faceImageHash,
        signatureKey: slot.signatureKey,
        signedAt: signedAt.toISOString(),
      };
    }

    if (!slot.faceImageBase64) {
      throw new BadRequestException(`Missing face image for slot ${slot.slotId}`);
    }

    const faceImage = this.decodeBase64Image(slot.faceImageBase64, 'Face image');
    const faceImageHash = createHash('sha256').update(faceImage).digest('hex');
    const signatureId = uuidv4();
    const signerDocument = (slot.signerDocument ?? '').replace(/\D/g, '');
    const signerName = slot.signerName.trim();

    const payload = {
      signatureId,
      slotId: slot.slotId,
      documentId: document.id,
      userId: user.sub,
      signedAt: signedAt.toISOString(),
      ipAddress: ipAddress ?? '',
      signerName,
      signerDocument,
      faceImageHash,
    };

    const secret = this.config.get<string>('BIOMETRIC_SIGNATURE_SECRET')
      ?? this.config.getOrThrow<string>('JWT_SECRET');
    const signatureKey = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const signature = em.create(BiometricSignature, {
      id: signatureId,
      user: em.getReference(User, user.sub),
      document,
      signerName,
      signerDocument,
      faceImageHash,
      signatureKey,
      ipAddress,
      signedAt,
    });

    em.persist(signature);

    return {
      signatureId,
      slotId: slot.slotId,
      label: slot.label,
      type: 'FACIAL',
      signerName,
      signerDocument,
      faceImageHash,
      signatureKey,
      signedAt: signedAt.toISOString(),
    };
  }

  private async getSignableDocument(em: EntityManager, documentId: string, user: UserPayload): Promise<Document> {
    const document = await em.findOne(Document, { id: documentId }, { populate: ['template'] });
    if (!document) throw new NotFoundException('Document not found');
    if (document.user.id !== user.sub) throw new ForbiddenException();
    if (document.status !== DocumentStatus.DONE) {
      throw new BadRequestException('Only generated documents can be signed');
    }
    return document;
  }

  private async finalizeSignedDocument({
    em,
    document,
    signatureType,
    signedAt,
    ipAddress,
    signatureData,
    logHtml,
  }: {
    em: EntityManager;
    document: Document;
    signatureType: SignatureType;
    signedAt: Date;
    ipAddress?: string;
    signatureData: Record<string, unknown>;
    logHtml: string;
  }): Promise<{ url: string; expiresAt: Date }> {
    const template = (document.template as any).unwrap?.() as Template
      ?? document.template as unknown as Template;
    const content = (template.schema as any)?.content as string | undefined;
    if (!content) throw new BadRequestException('Document template has no content to render');

    const renderedHtml = this.pdfService.renderHtml(content, document.variables);
    const signedPdf = await this.pdfService.generatePdf(`${renderedHtml}${logHtml}`);
    const s3Key = document.s3Key ?? `documents/${document.user.id}/${document.id}.pdf`;

    await this.s3Service.uploadPdf(s3Key, signedPdf);
    const { url, expiresAt } = await this.s3Service.getPresignedUrl(s3Key);

    document.signatureStatus = 'SIGNED';
    document.signatureType = signatureType;
    document.signedAt = signedAt;
    document.signatureIp = ipAddress;
    document.signatureData = signatureData;
    document.s3Key = s3Key;
    document.presignedUrl = url;
    document.expiresAt = expiresAt;

    await em.flush();
    return { url, expiresAt };
  }

  private renderWrittenSignatureLog({
    signerName,
    signedAt,
    ipAddress,
    signatureImageBase64,
    signatureImageHash,
    signatureId,
  }: {
    signerName: string;
    signedAt: Date;
    ipAddress?: string;
    signatureImageBase64: string;
    signatureImageHash: string;
    signatureId: string;
  }): string {
    return `
      <section style="break-before: page; padding-top: 24px;">
        <h1>Termo de Autenticação</h1>
        <p>Este documento foi assinado eletronicamente por assinatura escrita.</p>
        <div style="margin: 40px 0 24px; width: 320px; text-align: center;">
          <img src="${signatureImageBase64}" alt="Assinatura escrita" style="max-width: 320px; max-height: 120px; object-fit: contain;" />
          <div style="border-top: 1px solid #222; padding-top: 8px; margin-top: 8px;">${this.escapeHtml(signerName)}</div>
        </div>
        <table>
          <tr><th>Tipo</th><td>Assinatura escrita</td></tr>
          <tr><th>Data</th><td>${this.escapeHtml(signedAt.toISOString())}</td></tr>
          <tr><th>IP de origem</th><td>${this.escapeHtml(ipAddress ?? 'Não informado')}</td></tr>
          <tr><th>UUID do ato</th><td>${this.escapeHtml(signatureId)}</td></tr>
          <tr><th>Hash SHA-256 da imagem</th><td style="word-break: break-all;">${this.escapeHtml(signatureImageHash)}</td></tr>
        </table>
      </section>
    `;
  }

  private renderFacialSignatureLog({
    signerName,
    signerDocument,
    signedAt,
    ipAddress,
    signatureId,
    faceImageHash,
    signatureKey,
  }: {
    signerName: string;
    signerDocument: string;
    signedAt: Date;
    ipAddress?: string;
    signatureId: string;
    faceImageHash: string;
    signatureKey: string;
  }): string {
    return `
      <section style="break-before: page; padding-top: 24px;">
        <h1>Termo de Autenticação Biométrica</h1>
        <p>Este documento foi assinado por validação facial vinculada a uma transação única.</p>
        <div style="border: 2px solid #1d4ed8; border-radius: 8px; padding: 18px; margin: 24px 0; background: #eff6ff;">
          <h2 style="color: #1d4ed8;">Selo de Verificação Facial</h2>
          <p><strong>Nome completo:</strong> ${this.escapeHtml(signerName)}</p>
          <p><strong>Documento:</strong> ${this.escapeHtml(signerDocument)}</p>
          <p><strong>Data:</strong> ${this.escapeHtml(signedAt.toISOString())}</p>
          <p><strong>IP de origem:</strong> ${this.escapeHtml(ipAddress ?? 'Não informado')}</p>
          <p><strong>UUID único:</strong> ${this.escapeHtml(signatureId)}</p>
        </div>
        <table>
          <tr><th>Hash SHA-256 da face</th><td style="word-break: break-all;">${this.escapeHtml(faceImageHash)}</td></tr>
          <tr><th>Chave criptográfica</th><td style="word-break: break-all;">${this.escapeHtml(signatureKey)}</td></tr>
        </table>
      </section>
    `;
  }

  private renderBatchSignatureLog(signatures: Record<string, unknown>[], signedAt: Date, ipAddress?: string): string {
    const rows = signatures.map((signature) => {
      const type = signature.type === 'FACIAL' ? 'Facial' : 'Escrita';
      const details = signature.type === 'FACIAL'
        ? `
          <div><strong>UUID biométrico:</strong> ${this.escapeHtml(String(signature.signatureId))}</div>
          <div><strong>Hash da face:</strong> <span style="word-break:break-all">${this.escapeHtml(String(signature.faceImageHash))}</span></div>
          <div><strong>Chave criptográfica:</strong> <span style="word-break:break-all">${this.escapeHtml(String(signature.signatureKey))}</span></div>
        `
        : `
          <div><strong>UUID do ato:</strong> ${this.escapeHtml(String(signature.signatureId))}</div>
          <div><strong>Hash da imagem:</strong> <span style="word-break:break-all">${this.escapeHtml(String(signature.signatureImageHash))}</span></div>
        `;

      return `
        <div style="border:1px solid #d1d5db;border-radius:8px;padding:14px;margin:12px 0;">
          <h2>${this.escapeHtml(String(signature.label))}</h2>
          <div><strong>Tipo:</strong> ${type}</div>
          <div><strong>Assinante:</strong> ${this.escapeHtml(String(signature.signerName))}</div>
          ${details}
        </div>
      `;
    }).join('');

    return `
      <section style="break-before: page; padding-top: 24px;">
        <h1>Log de Assinaturas</h1>
        <p>Este documento recebeu ${signatures.length} assinatura(s) nesta transação.</p>
        <p><strong>Data:</strong> ${this.escapeHtml(signedAt.toISOString())}</p>
        <p><strong>IP de origem:</strong> ${this.escapeHtml(ipAddress ?? 'Não informado')}</p>
        ${rows}
      </section>
    `;
  }

  private decodeBase64Image(value: string, label: string): Buffer {
    const match = value.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!match) throw new BadRequestException(`${label} must be a base64 image data URL`);

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength === 0) throw new BadRequestException(`${label} is empty`);
    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new BadRequestException(`${label} must be at most 5 MB`);
    }

    return buffer;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

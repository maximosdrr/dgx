import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../common/entities/document.entity';
import { Template } from '../common/entities/template.entity';
import { User } from '../common/entities/user.entity';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { DocumentStatus, UserPayload } from '@docgen/shared';
import { PdfService } from '../pdf/pdf.service';
import { S3Service } from '../storage/s3.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly pdfService: PdfService,
    private readonly s3Service: S3Service,
    private readonly billingService: BillingService,
  ) {}

  async generate(dto: GenerateDocumentDto, user: UserPayload): Promise<Document> {
    await this.billingService.checkDocumentLimit(user.sub);

    const em = this.em.fork();
    const template = await em.findOne(Template, { id: dto.templateId, isActive: true });
    if (!template) throw new NotFoundException('Template not found');
    if (template.user.id !== user.sub) throw new ForbiddenException();

    const content = (template.schema as any)?.content as string | undefined;
    if (!content) throw new BadRequestException('Template has no content to render');

    this.validateVariables(template.variables, dto.variables);

    const userRef = em.getReference(User, user.sub);
    const doc = em.create(Document, {
      id: uuidv4(),
      user: userRef,
      template,
      variables: dto.variables,
      status: DocumentStatus.PROCESSING,
    });
    await em.flush();

    try {
      const html = this.pdfService.renderHtml(content, dto.variables);
      const pdfBuffer = await this.pdfService.generatePdf(html);

      const s3Key = `documents/${user.sub}/${doc.id}.pdf`;
      await this.s3Service.uploadPdf(s3Key, pdfBuffer);

      const { url, expiresAt } = await this.s3Service.getPresignedUrl(s3Key);

      doc.status = DocumentStatus.DONE;
      doc.s3Key = s3Key;
      doc.presignedUrl = url;
      doc.expiresAt = expiresAt;
      await em.flush();

      this.logger.log(`Document ${doc.id} generated for user ${user.sub}`);
    } catch (err) {
      doc.status = DocumentStatus.FAILED;
      await em.flush();
      throw err;
    }

    return doc;
  }

  async findAll(user: UserPayload): Promise<Document[]> {
    const em = this.em.fork();
    return em.find(
      Document,
      { user: { id: user.sub } },
      { populate: ['template'], orderBy: { createdAt: 'DESC' } },
    );
  }

  async findOne(id: string, user: UserPayload): Promise<Document> {
    const em = this.em.fork();
    const doc = await em.findOne(Document, { id }, { populate: ['template'] });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.user.id !== user.sub) throw new ForbiddenException();

    if (doc.status === DocumentStatus.DONE && doc.s3Key && this.isExpired(doc.expiresAt)) {
      const { url, expiresAt } = await this.s3Service.getPresignedUrl(doc.s3Key);
      doc.presignedUrl = url;
      doc.expiresAt = expiresAt;
      await em.flush();
    }

    if (doc.signatureData) {
      doc.signatureData = await this.enrichSignatureData(doc.signatureData);
    }

    return doc;
  }

  private async enrichSignatureData(
    signatureData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const signatures = signatureData.signatures;
    if (!Array.isArray(signatures)) return signatureData;

    const enriched = await Promise.all(
      signatures.map(async (signature) => {
        if (!signature || typeof signature !== 'object') return signature;

        const data = signature as Record<string, unknown>;
        if (
          data.type === 'WRITTEN' &&
          typeof data.signatureImageKey === 'string' &&
          typeof data.signatureImageUrl !== 'string'
        ) {
          const { url } = await this.s3Service.getPresignedUrl(data.signatureImageKey);
          return { ...data, signatureImageUrl: url };
        }

        return data;
      }),
    );

    return { ...signatureData, signatures: enriched };
  }

  private validateVariables(required: string[], provided: Record<string, string>): void {
    const missing = required.filter((v) => !(v in provided));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing template variables: ${missing.join(', ')}`);
    }
  }

  private isExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return true;
    return expiresAt.getTime() < Date.now() + 60_000;
  }
}

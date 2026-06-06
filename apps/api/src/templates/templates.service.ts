import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Template } from '../common/entities/template.entity';
import { User } from '../common/entities/user.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UserPayload } from '@docgen/shared';
import { BillingService } from '../billing/billing.service';
import { S3Service } from '../storage/s3.service';
import { v4 as uuidv4 } from 'uuid';

/** Multer file shape (mirrors Express.Multer.File without global augmentation) */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly em: EntityManager,
    private readonly billingService: BillingService,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(user: UserPayload): Promise<Template[]> {
    const em = this.em.fork();
    return em.find(Template, { user: { id: user.sub }, isActive: true });
  }

  async findOne(id: string, user: UserPayload): Promise<Template> {
    const em = this.em.fork();
    const template = await em.findOne(Template, { id, isActive: true });
    if (!template) throw new NotFoundException('Template not found');
    if (template.user.id !== user.sub) throw new ForbiddenException();
    return template;
  }

  async create(dto: CreateTemplateDto, user: UserPayload): Promise<Template> {
    await this.billingService.checkTemplateLimit(user.sub);
    const em = this.em.fork();
    const userRef = em.getReference(User, user.sub);
    const template = em.create(Template, {
      ...dto,
      user: userRef,
      variables: dto.variables ?? [],
    });
    await em.flush();
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto, user: UserPayload): Promise<Template> {
    const template = await this.findOne(id, user);
    const em = this.em.fork();
    const fresh = await em.findOneOrFail(Template, { id });
    em.assign(fresh, dto);
    await em.flush();
    return fresh;
  }

  async remove(id: string, user: UserPayload): Promise<void> {
    await this.findOne(id, user);
    const em = this.em.fork();
    const fresh = await em.findOneOrFail(Template, { id });
    fresh.isActive = false;
    await em.flush();
  }

  async uploadImage(
    file: MulterFile,
    user: UserPayload,
  ): Promise<{ url: string }> {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_BYTES = 5 * 1024 * 1024;

    if (!ALLOWED.includes(file.mimetype))
      throw new BadRequestException('Apenas imagens JPEG, PNG ou WebP são permitidas');
    if (file.size > MAX_BYTES)
      throw new BadRequestException('Imagem deve ter no máximo 5 MB');

    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const key = `templates/${user.sub}/${uuidv4()}.${ext}`;
    await this.s3Service.uploadFile(key, file.buffer, file.mimetype);
    return { url: this.s3Service.getObjectUrl(key) };
  }
}

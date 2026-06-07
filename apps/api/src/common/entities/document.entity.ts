import { Entity, PrimaryKey, Property, ManyToOne, Enum, Ref, Opt } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { DocumentStatus } from '@docgen/shared';
import { User } from './user.entity';
import { Template } from './template.entity';

export type SignatureStatus = 'PENDING' | 'SIGNED';
export type SignatureType = 'WRITTEN' | 'FACIAL';

@Entity({ tableName: 'documents' })
export class Document {
  @PrimaryKey({ type: 'uuid' })
  id: string & Opt = uuidv4();

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

  @ManyToOne(() => Template, { ref: true })
  template!: Ref<Template>;

  @Enum(() => DocumentStatus)
  status: DocumentStatus & Opt = DocumentStatus.PENDING;

  @Property({ nullable: true, fieldName: 's3_key' })
  s3Key?: string;

  @Property({ nullable: true, type: 'text' })
  presignedUrl?: string;

  @Property({ nullable: true })
  expiresAt?: Date;

  @Property({ type: 'jsonb', default: '{}' })
  variables: Record<string, string> & Opt = {};

  @Property({ fieldName: 'signature_status' })
  signatureStatus: SignatureStatus & Opt = 'PENDING';

  @Property({ nullable: true, fieldName: 'signature_type' })
  signatureType?: SignatureType;

  @Property({ nullable: true, fieldName: 'signed_at' })
  signedAt?: Date;

  @Property({ nullable: true, fieldName: 'signature_ip' })
  signatureIp?: string;

  @Property({ type: 'jsonb', nullable: true, fieldName: 'signature_data' })
  signatureData?: Record<string, unknown>;

  @Property()
  createdAt: Date & Opt = new Date();
}

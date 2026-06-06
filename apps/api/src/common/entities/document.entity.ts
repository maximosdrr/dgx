import { Entity, PrimaryKey, Property, ManyToOne, Enum, Ref, Opt } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { DocumentStatus } from '@docgen/shared';
import { User } from './user.entity';
import { Template } from './template.entity';

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

  @Property()
  createdAt: Date & Opt = new Date();
}

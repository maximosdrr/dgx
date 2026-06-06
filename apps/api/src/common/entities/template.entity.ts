import { Entity, PrimaryKey, Property, ManyToOne, Enum, Ref, Opt } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { TemplateCategory } from '@docgen/shared';
import { User } from './user.entity';

@Entity({ tableName: 'templates' })
export class Template {
  @PrimaryKey({ type: 'uuid' })
  id: string & Opt = uuidv4();

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

  @Property()
  name!: string;

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Enum(() => TemplateCategory)
  category: TemplateCategory & Opt = TemplateCategory.OUTRO;

  @Property({ type: 'jsonb', nullable: true })
  schema?: Record<string, unknown>;

  @Property({ type: 'text[]', default: '{}' })
  variables: string[] & Opt = [];

  @Property({ default: true })
  isActive: boolean & Opt = true;

  @Property()
  createdAt: Date & Opt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date & Opt = new Date();
}

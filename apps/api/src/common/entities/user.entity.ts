import { Entity, PrimaryKey, Property, OneToMany, Collection, Opt } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Template } from './template.entity';
import { Document } from './document.entity';
import { UsageLog } from './usage-log.entity';

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey({ type: 'uuid' })
  id: string & Opt = uuidv4();

  @Property({ unique: true })
  email!: string;

  @Property()
  name!: string;

  @Property({ hidden: true })
  passwordHash!: string;

  @OneToMany(() => Template, (t) => t.user)
  templates = new Collection<Template>(this);

  @OneToMany(() => Document, (d) => d.user)
  documents = new Collection<Document>(this);

  @OneToMany(() => UsageLog, (u) => u.user)
  usageLogs = new Collection<UsageLog>(this);

  @Property()
  createdAt: Date & Opt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date & Opt = new Date();
}

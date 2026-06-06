import { Entity, PrimaryKey, Property, ManyToOne, Ref, Opt } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';

@Entity({ tableName: 'usage_logs' })
export class UsageLog {
  @PrimaryKey({ type: 'uuid' })
  id: string & Opt = uuidv4();

  @ManyToOne(() => User, { nullable: true, ref: true })
  user?: Ref<User>;

  @Property()
  endpoint!: string;

  @Property()
  method!: string;

  @Property()
  timestamp: Date & Opt = new Date();
}

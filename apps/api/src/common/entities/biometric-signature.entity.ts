import { Entity, PrimaryKey, Property, ManyToOne, Ref, Opt } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { Document } from './document.entity';

@Entity({ tableName: 'biometric_signatures' })
export class BiometricSignature {
  @PrimaryKey({ type: 'uuid' })
  id: string & Opt = uuidv4();

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

  @ManyToOne(() => Document, { ref: true })
  document!: Ref<Document>;

  @Property()
  signerName!: string;

  @Property()
  signerDocument!: string;

  @Property({ length: 64 })
  faceImageHash!: string;

  @Property({ length: 64 })
  signatureKey!: string;

  @Property({ nullable: true })
  ipAddress?: string;

  @Property()
  signedAt: Date & Opt = new Date();
}

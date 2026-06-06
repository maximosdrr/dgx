import { Migration } from '@mikro-orm/migrations';

export class Migration003_BiometricSignatures extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE biometric_signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        document_id UUID NOT NULL REFERENCES documents(id),
        signer_name VARCHAR(255) NOT NULL,
        signer_document VARCHAR(32) NOT NULL,
        face_image_hash VARCHAR(64) NOT NULL,
        signature_key VARCHAR(64) NOT NULL,
        ip_address VARCHAR(64),
        signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_biometric_signatures_user_id ON biometric_signatures(user_id);
      CREATE INDEX idx_biometric_signatures_document_id ON biometric_signatures(document_id);
      CREATE UNIQUE INDEX idx_biometric_signatures_signature_key ON biometric_signatures(signature_key);
    `);
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS biometric_signatures;');
  }
}

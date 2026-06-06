import { Migration } from '@mikro-orm/migrations';

export class Migration004_DocumentSignatures extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TYPE signature_status AS ENUM ('PENDING', 'SIGNED');
      CREATE TYPE signature_type AS ENUM ('WRITTEN', 'FACIAL');

      ALTER TABLE documents
        ADD COLUMN signature_status signature_status NOT NULL DEFAULT 'PENDING',
        ADD COLUMN signature_type signature_type,
        ADD COLUMN signed_at TIMESTAMPTZ,
        ADD COLUMN signature_ip VARCHAR(64),
        ADD COLUMN signature_data JSONB;

      CREATE INDEX idx_documents_signature_status ON documents(signature_status);
      CREATE INDEX idx_documents_signature_type ON documents(signature_type);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP INDEX IF EXISTS idx_documents_signature_type;
      DROP INDEX IF EXISTS idx_documents_signature_status;

      ALTER TABLE documents
        DROP COLUMN IF EXISTS signature_data,
        DROP COLUMN IF EXISTS signature_ip,
        DROP COLUMN IF EXISTS signed_at,
        DROP COLUMN IF EXISTS signature_type,
        DROP COLUMN IF EXISTS signature_status;

      DROP TYPE IF EXISTS signature_type;
      DROP TYPE IF EXISTS signature_status;
    `);
  }
}

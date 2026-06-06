import { Migration } from '@mikro-orm/migrations';

export class Migration001_InitSchema extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TYPE template_category AS ENUM ('CONTRATO', 'CERTIFICADO', 'PROPOSTA', 'OUTRO');
      CREATE TYPE document_status AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category template_category NOT NULL DEFAULT 'OUTRO',
        schema JSONB,
        variables TEXT[] NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        template_id UUID NOT NULL REFERENCES templates(id),
        status document_status NOT NULL DEFAULT 'PENDING',
        s3_key VARCHAR(255),
        presigned_url TEXT,
        expires_at TIMESTAMPTZ,
        variables JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_templates_user_id ON templates(user_id);
      CREATE INDEX idx_documents_user_id ON documents(user_id);
      CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
      CREATE INDEX idx_usage_logs_timestamp ON usage_logs(timestamp);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP TABLE IF EXISTS usage_logs;
      DROP TABLE IF EXISTS documents;
      DROP TABLE IF EXISTS templates;
      DROP TABLE IF EXISTS users;
      DROP TYPE IF EXISTS document_status;
      DROP TYPE IF EXISTS template_category;
    `);
  }
}

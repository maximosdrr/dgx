import 'reflect-metadata';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { User } from '../common/entities/user.entity';
import { Template } from '../common/entities/template.entity';
import { Document } from '../common/entities/document.entity';
import { UsageLog } from '../common/entities/usage-log.entity';
import { Subscription } from '../common/entities/subscription.entity';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL ?? 'postgresql://docgen:docgen@localhost:5432/docgen',
  entities: [User, Template, Document, UsageLog, Subscription],
  migrations: {
    path: './src/database/migrations',
    pathTs: './src/database/migrations',
    glob: '!(*.d).{js,ts}',
  },
  debug: process.env.NODE_ENV === 'local',
  extensions: [Migrator],
});

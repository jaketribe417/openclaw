import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://edt_admin:changeme_in_production@localhost:5432/equipment_downtime_tracker',
  },
  verbose: true,
  strict: true,
});

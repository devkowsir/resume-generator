import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../../../.env' });

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './schema',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});

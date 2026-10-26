// npm run db:migrate: applies db/schema.sql to DATABASE_URL (from the environment, else .env.local). On Vercel it runs
// in every build (vercel.json's buildCommand), after it: where the environment has no database (previews) it does nothing.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL && process.env.VERCEL) {
  console.log('schema: no DATABASE_URL here, skipped');
  process.exit(0);
}
if (!process.env.DATABASE_URL) process.loadEnvFile(new URL('../.env.local', import.meta.url));
const sql = neon(/** @type {string} */ (process.env.DATABASE_URL));
const schema = readFileSync(new URL('schema.sql', import.meta.url), 'utf8').replace(/--.*$/gm, '');
// one statement per request (the HTTP driver runs one at a time); the schema has no ';' inside a statement
for (const statement of schema.split(';').map((s) => s.trim()).filter(Boolean)) await sql.query(statement);
console.log('schema applied');

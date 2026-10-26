// npm run db:migrate, after db/migrate.js (so on every Vercel build): keeps a year of challenge scrambles ahead in this
// installation's database (challenge_scrambles), the daily's ('d:<day>') and the weekly's ('w:<Monday>:<0-4>'), each a
// random-state 3x3 scramble (cubing.js, as WCA's). Only the missing ones are made: the first run fills the year, later
// ones add the days since. They never are in the code: an open repository would show every future challenge, and each
// installation has its own. Where the environment has no database (previews) it does nothing.
import { neon } from '@neondatabase/serverless';
import { randomScrambleForEvent } from 'cubing/scramble';
import { utcDay } from '../api/_lib/daily.js';
import { SOLVES, weekOf } from '../api/_lib/weekly.js';

const DAYS = 366, WEEKS = 53;
const DAY_MS = 86_400_000;

if (!process.env.DATABASE_URL && process.env.VERCEL) {
  console.log('scrambles: no DATABASE_URL here, skipped');
  process.exit(0);
}
if (!process.env.DATABASE_URL) process.loadEnvFile(new URL('../.env.local', import.meta.url));
const sql = neon(/** @type {string} */ (process.env.DATABASE_URL));

const now = Date.now(), monday = Date.parse(weekOf(now));
const keys = [
  ...Array.from({ length: DAYS }, (_, i) => `d:${utcDay(now + i * DAY_MS)}`),
  ...Array.from({ length: WEEKS * SOLVES }, (_, i) => `w:${utcDay(monday + Math.floor(i / SOLVES) * 7 * DAY_MS)}:${i % SOLVES}`),
];
const have = new Set((await sql.query('SELECT challenge FROM challenge_scrambles WHERE challenge = ANY($1::text[])', [keys])).map((r) => r.challenge));
const missing = keys.filter((k) => !have.has(k));
/** @type {string[]} */
const scrambles = [];
for (const k of missing) scrambles.push((await randomScrambleForEvent('333')).toString().replace(/2'/g, '2')); // as the Resolver writes them
if (missing.length) await sql.query('INSERT INTO challenge_scrambles (challenge, scramble) SELECT * FROM unnest($1::text[], $2::text[]) ON CONFLICT DO NOTHING', [missing, scrambles]);
console.log(`scrambles: ${missing.length} new, ${have.size} kept`);
process.exit(0); // cubing's search worker would keep node running

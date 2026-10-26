// The API's SQL against a real Postgres: PGlite (Postgres compiled to WebAssembly, in this process), with db/schema.sql
// applied, standing in for Neon behind server.js's db() (same interface: sql`…`, .query, .transaction). No network or
// secrets, so it runs in CI too. The handlers are called as Vercel calls them, with a signed-in session's cookie.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { useDb } from '../api/_lib/server.js';
import { sessionCookie, tokenHash } from '../api/_lib/rules.js';
import { MAX_KEYS } from './backup-keys.js';
import { utcDay } from '../api/_lib/daily.js';

process.env.AUTH_SECRET = 'test-secret';
const pg = new PGlite();
type Query = PromiseLike<Record<string, unknown>[]> & { text: string; params: unknown[] };
const run = (text: string, params: unknown[]) => pg.query<Record<string, unknown>>(text, params).then((r) => r.rows);
// a query as neon gives it: built now, run when awaited, or by transaction() in order
const lazy = (text: string, params: unknown[]): Query => ({ text, params, then: (ok, fail) => run(text, params).then(ok, fail) });
const sql = Object.assign((strings: TemplateStringsArray, ...values: unknown[]) => lazy(strings.reduce((t, s, i) => `${t}$${i}${s}`), values), {
  query: (text: string, params: unknown[] = []) => lazy(text, params),
  transaction: (queries: Query[]) => pg.transaction(async (tx) => {
    const out = [];
    for (const q of queries) out.push((await tx.query<Record<string, unknown>>(q.text, q.params)).rows);
    return out;
  }),
});
useDb(sql as never);

// db/migrate.js's way: comments out, one statement per ';'
const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8').replace(/--.*$/gm, '');
const migrate = async () => { for (const s of schema.split(';').map((x) => x.trim()).filter(Boolean)) await pg.query(s); };

const ORIGIN = 'https://twistlab.app';
let users = 0;
/** A new account with a live session: its cookie. */
async function signIn(name: string) {
  const token = `token-${++users}`;
  const [{ id }] = await run('INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id', [`${name}@example.com`, name]);
  await run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '1 day')", [tokenHash(token), id]);
  return { id: id as number, cookie: sessionCookie(token, true).split(';')[0] };
}
const request = (path: string, cookie: string, body?: unknown) => new Request(`${ORIGIN}${path}`, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { cookie, origin: ORIGIN, host: 'twistlab.app', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

test('schema: applies on an empty database, and again on top of itself (every deploy runs it whole)', async () => {
  await migrate();
  await migrate();
  const tables = (await run("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", [])).map((r) => r.table_name);
  for (const t of ['users', 'sessions', 'progress', 'daily_results', 'weekly_results', 'challenge_plays', 'challenge_scrambles']) assert.ok(tables.includes(t), t);
});

test('progress: new keys are saved, a key changed elsewhere comes back stale, and the account has a quota', async () => {
  const { GET, POST } = await import('../api/progress.js');
  const { cookie } = await signIn('ana');
  const push = async (items: Record<string, { v: string | null; t: number; b: number }>) => {
    const res = await POST(request('/api/progress', cookie, { items }));
    return [res.status, await res.json()];
  };
  assert.deepEqual(await push({ 'cube-results': { v: '[1]', t: 10, b: 0 }, 'academy-stats': { v: '{}', t: 10, b: 0 } }), [200, { stale: [] }]);
  // from version 10 to 20: written; a device still at 5 (it hasn't seen 10): stale, nothing written
  assert.deepEqual(await push({ 'cube-results': { v: '[1,2]', t: 20, b: 10 }, 'academy-stats': { v: '{"x":1}', t: 30, b: 5 } }), [200, { stale: ['academy-stats'] }]);
  // a new key the account already has (another device created it): stale too
  assert.deepEqual(await push({ 'academy-stats': { v: '{"y":1}', t: 40, b: 0 } }), [200, { stale: ['academy-stats'] }]);
  const items = (await (await GET(request('/api/progress', cookie))).json()).items;
  assert.deepEqual(items, { 'cube-results': { v: '[1,2]', t: 20 }, 'academy-stats': { v: '{}', t: 10 } });
  // more keys than the account may hold: refused whole
  const many = Object.fromEntries(Array.from({ length: MAX_KEYS }, (_, i) => [`cube-k${i}`, { v: '1', t: 1, b: 0 }]));
  const [status] = await push(many);
  assert.equal(status, 413);
  assert.equal((await run('SELECT count(*)::int AS n FROM progress', []))[0].n, 2);
});

test('daily: the ranking orders by time with +2 added, DNF last, ties by who sent first; only the first result counts', async () => {
  const { GET, POST } = await import('../api/daily.js');
  const today = utcDay(Date.now());
  await run('INSERT INTO challenge_scrambles (challenge, scramble) VALUES ($1, $2)', [`d:${today}`, "R U R' U'"]);
  const result = (id: number, ms: number, penalty: string, secondsAgo: number) =>
    run("INSERT INTO daily_results (day, user_id, ms, penalty, at) VALUES ($1::date, $2, $3, $4, now() - make_interval(secs => $5))", [today, id, ms, penalty, secondsAgo]);
  const [a, b, c, d] = [await signIn('a'), await signIn('b'), await signIn('c'), await signIn('d')];
  await result(a.id, 9000, '0', 30);
  await result(b.id, 8000, '2000', 40); // 10.00 with its +2
  await result(c.id, 5000, 'DNF', 50);
  await result(d.id, 9000, '0', 20); // the same time as a, sent later
  const board = (await (await GET(request('/api/daily', c.cookie))).json()).today;
  assert.equal(board.count, 4);
  assert.deepEqual(board.top.map((e: { name: string }) => e.name), ['a', 'd', 'b', 'c']);
  assert.deepEqual(board.me, { rank: 4, name: 'c', ms: 5000, penalty: 'DNF', verified: false });
  // a new player: the first result is kept, a second one is not
  const e = await signIn('e');
  const send = async (ms: number) => (await (await POST(request('/api/daily', e.cookie, { date: today, ms, penalty: 0 }))).json()).saved;
  assert.equal(await send(7000), true);
  assert.equal(await send(6000), false);
  assert.deepEqual((await run('SELECT ms FROM daily_results WHERE user_id = $1', [e.id])).map((r) => r.ms), [7000]);
});

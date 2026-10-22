// The account's API, the server part: the database, JSON responses, the session from its cookie and the rate limits.
import { createHmac } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { isSecure, readCookie, retryAfter, SESSION_DAYS, sameOrigin, sessionCookie, tokenHash } from './rules.js';

/** @type {import('@neondatabase/serverless').NeonQueryFunction<false, false> | undefined} */
let conn;
/** Neon over HTTP: one request per query (or per transaction), nothing to pool or close. */
export const db = () => (conn ??= neon(/** @type {string} */ (process.env.DATABASE_URL)));
export const secret = () => /** @type {string} */ (process.env.AUTH_SECRET);

/** A JSON answer, never cached.
 * @param {unknown} body @param {number} [status] @param {Record<string, string>} [headers] */
export const json = (body, status = 200, headers = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

/** A route's handler: same-origin requests only (CSRF), and a generic error for anything unexpected.
 * @param {(req: Request) => Promise<Response>} fn @returns {(req: Request) => Promise<Response>} */
export const route = (fn) => async (req) => {
  if (!sameOrigin(req.method, req.headers.get('origin'), req.headers.get('host'))) return json({ error: 'origin' }, 403);
  try {
    return await fn(req);
  } catch (e) {
    console.error(e);
    return json({ error: 'server' }, 500);
  }
};

/** The request's JSON object, if it is JSON and at most `max` bytes; else null.
 * @param {Request} req @param {number} max @returns {Promise<Record<string, unknown> | null>} */
export async function body(req, max) {
  if (!req.headers.get('content-type')?.startsWith('application/json') || Number(req.headers.get('content-length')) > max) return null;
  const text = await req.text();
  if (Buffer.byteLength(text) > max) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** The Set-Cookie that ends the session. @param {Request} req */
export const clearCookie = (req) => ({ 'Set-Cookie': sessionCookie(null, isSecure(req.url)) });

/** @typedef {{ id: number, email: string, headers: Record<string, string> }} Session */

/** The signed-in user, from the session cookie; null without a live session. The session slides: each use moves its
 * end SESSION_DAYS ahead and sends the cookie again (`headers`), written at most once an hour to spare the database.
 * @param {Request} req @returns {Promise<Session | null>} */
export async function session(req) {
  const token = readCookie(req.headers.get('cookie'));
  if (!token) return null;
  const hash = tokenHash(token);
  const [s] = await db()`SELECT u.id, u.email, s.last_used_at < now() - interval '1 hour' AS stale
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ${hash} AND s.expires_at > now()`;
  if (!s) return null;
  if (!s.stale) return { id: s.id, email: s.email, headers: {} };
  await db().transaction([
    db()`UPDATE sessions SET expires_at = now() + make_interval(days => ${SESSION_DAYS}), last_used_at = now() WHERE token_hash = ${hash}`,
    db()`UPDATE users SET last_seen_at = now() WHERE id = ${s.id}`,
  ]);
  return { id: s.id, email: s.email, headers: { 'Set-Cookie': sessionCookie(token, isSecure(req.url)) } };
}

/** Rate limits: each rule is [what, window in seconds, max requests in it]. If every one is under its max, the request
 * counts in each: 0; else the seconds to wait. `what` (an email, an IP…) is stored as an HMAC, not as is.
 * The request is recorded first (its own statement, committed) and counted after, so concurrent requests see each
 * other: at the edge a burst can be refused whole, never let through. A refused request's record is removed again.
 * @param {[string, number, number][]} rules */
export async function limit(rules) {
  const buckets = rules.map(([what]) => createHmac('sha256', secret()).update(what).digest('base64url').slice(0, 22));
  const mine = await db().query('INSERT INTO rate_events (bucket) SELECT DISTINCT unnest($1::text[]) RETURNING ctid::text AS id', [buckets]);
  const rows = await db().query(
    `SELECT count(e.at)::int AS n, coalesce(extract(epoch FROM min(e.at) + make_interval(secs => r.secs) - now()), 0)::float8 AS "expiresIn"
     FROM unnest($1::text[], $2::int[]) WITH ORDINALITY AS r(bucket, secs, i)
     LEFT JOIN rate_events e ON e.bucket = r.bucket AND e.at > now() - make_interval(secs => r.secs)
     GROUP BY r.i, r.secs ORDER BY r.i`,
    [buckets, rules.map((r) => r[1])],
  );
  // n - 1: the requests before this one
  const wait = retryAfter(rows.map((r, i) => ({ n: r.n - 1, expiresIn: r.expiresIn, max: rules[i][2] })));
  if (wait) {
    await db().query('DELETE FROM rate_events WHERE ctid = ANY($1::tid[])', [mine.map((r) => r.id)]);
    return wait;
  }
  // ponytail: pruned now and then (no index on `at` alone: the table only holds about a day of events)
  if (Math.random() < 0.02) await db()`DELETE FROM rate_events WHERE at < now() - interval '1 day'`;
  return 0;
}

/** 429 with the wait. @param {number} wait */
export const tooMany = (wait) => json({ error: 'rate', retryAfter: wait }, 429, { 'Retry-After': String(wait) });

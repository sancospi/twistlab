// The account's copy of the app's data (src/sync.ts), a row per localStorage key.
// GET /api/progress → {items: {key: {v, t}}}: everything (v null = deleted).
// POST /api/progress {items: {key: {v, t, b}}}: each key is written only if the account still has version b (0: none),
// so a device that hasn't seen another's change can't overwrite it: those keys come back in `stale`, to fetch and merge.
import { MAX_KEYS, MAX_REQUEST, MAX_TOTAL, parseItems } from './_lib/rules.js';
import { body, db, json, limit, route, session, tooMany } from './_lib/server.js';

/** @param {Request} req */
export const GET = route(async (req) => {
  const s = await session(req);
  if (!s) return json({ error: 'auth' }, 401);
  const rows = await db()`SELECT key, value, updated_at FROM progress WHERE user_id = ${s.id}`;
  return json({ items: Object.fromEntries(rows.map((r) => [r.key, { v: r.value, t: Number(r.updated_at) }])) }, 200, s.headers);
});

/** @param {Request} req */
export const POST = route(async (req) => {
  const s = await session(req);
  if (!s) return json({ error: 'auth' }, 401);
  const rows = parseItems((await body(req, MAX_REQUEST))?.items);
  if (!rows) return json({ error: 'bad' }, 400);
  if (!rows.length) return json({ stale: [] }, 200, s.headers);
  const wait = await limit([[`push:user:${s.id}`, 3600, 60]]);
  if (wait) return tooMany(wait);
  const keys = rows.map((r) => r.k);
  // One push per account at a time (the lock), and written only if the account, with these values in place of the
  // stored ones, stays within MAX_KEYS and MAX_TOTAL: checked in the same statement, so concurrent pushes can't each pass.
  const [, [r]] = await db().transaction([
    db()`SELECT pg_advisory_xact_lock(${s.id}::bigint)`,
    db()`WITH x AS (
      SELECT * FROM unnest(${keys}::text[], ${rows.map((r) => r.v)}::text[], ${rows.map((r) => r.t)}::bigint[], ${rows.map((r) => r.b)}::bigint[]) AS x(k, v, t, b)
    ), other AS (
      SELECT count(*) AS n, coalesce(sum(octet_length(value)), 0) AS bytes FROM progress WHERE user_id = ${s.id} AND NOT (key = ANY(${keys}))
    ), fits AS (
      SELECT other.n + (SELECT count(*) FROM x) <= ${MAX_KEYS} AND other.bytes + (SELECT coalesce(sum(octet_length(v)), 0) FROM x) <= ${MAX_TOTAL} AS ok FROM other
    ), up AS (
      UPDATE progress p SET value = x.v, updated_at = x.t FROM x, fits WHERE fits.ok AND p.user_id = ${s.id} AND p.key = x.k AND p.updated_at = x.b RETURNING p.key
    ), ins AS (
      INSERT INTO progress (user_id, key, value, updated_at) SELECT ${s.id}, k, v, t FROM x, fits WHERE fits.ok AND b = 0 ON CONFLICT DO NOTHING RETURNING key
    )
    SELECT (SELECT ok FROM fits) AS fits, ARRAY(SELECT key FROM up UNION ALL SELECT key FROM ins) AS saved`,
  ]);
  if (!r.fits) return json({ error: 'full' }, 413);
  const ok = new Set(r.saved);
  return json({ stale: keys.filter((k) => !ok.has(k)) }, 200, s.headers);
});

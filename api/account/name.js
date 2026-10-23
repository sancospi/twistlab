// POST /api/account/name {name}: the account's public name in the daily challenge's ranking ('' = none: "Anónimo").
import { normalizeName } from '../_lib/daily.js';
import { body, db, json, limit, route, session, tooMany } from '../_lib/server.js';

/** @param {Request} req */
export const POST = route(async (req) => {
  const s = await session(req);
  if (!s) return json({ error: 'auth' }, 401);
  const name = normalizeName((await body(req, 1024))?.name);
  if (name === null) return json({ error: 'name' }, 400);
  const wait = await limit([[`name:user:${s.id}`, 3600, 20]]);
  if (wait) return tooMany(wait);
  await db()`UPDATE users SET name = ${name || null} WHERE id = ${s.id}`;
  return json({ name }, 200, s.headers);
});

// POST /api/auth/logout: ends this session (the data stays in the account and on the device).
import { readCookie, tokenHash } from '../_lib/rules.js';
import { clearCookie, db, json, route } from '../_lib/server.js';

/** @param {Request} req */
export const POST = route(async (req) => {
  const token = readCookie(req.headers.get('cookie'));
  if (token) await db()`DELETE FROM sessions WHERE token_hash = ${tokenHash(token)}`;
  return json({ ok: true }, 200, clearCookie(req));
});

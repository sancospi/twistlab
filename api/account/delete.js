// POST /api/account/delete: deletes the account, its sessions and its synced progress (the device keeps its own copy).
import { clearCookie, db, json, route, session } from '../_lib/server.js';

/** @param {Request} req */
export const POST = route(async (req) => {
  const s = await session(req);
  if (!s) return json({ error: 'auth' }, 401);
  await db().transaction([
    db()`DELETE FROM users WHERE id = ${s.id}`, // sessions and progress go with it (ON DELETE CASCADE)
    db()`DELETE FROM login_codes WHERE email = ${s.email}`,
  ]);
  return json({ ok: true }, 200, clearCookie(req));
});

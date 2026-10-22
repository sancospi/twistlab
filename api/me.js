// GET /api/me: the signed-in account ({email}) or 401. Each visit's call keeps the session alive (server.js, session).
import { json, route, session } from './_lib/server.js';

/** @param {Request} req */
export const GET = route(async (req) => {
  const s = await session(req);
  return s ? json({ email: s.email }, 200, s.headers) : json({ error: 'auth' }, 401);
});

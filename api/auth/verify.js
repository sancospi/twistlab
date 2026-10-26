// POST /api/auth/verify {email, code}: signs in with the emailed code (CODE_ATTEMPTS tries per code): creates the
// account the first time (with a random public name), and a session (the cookie). Answers {email, name}.
import { clientIp, CODE_ATTEMPTS, codeHash, isSecure, newToken, normalizeEmail, sameHash, SESSION_DAYS, sessionCookie, tokenHash } from '../_lib/rules.js';
import { body, db, giveName, json, limit, route, secret, tooMany } from '../_lib/server.js';

/** @param {Request} req */
export const POST = route(async (req) => {
  const b = await body(req, 1024);
  const email = normalizeEmail(b?.email);
  const code = typeof b?.code === 'string' && /^\d{6}$/.test(b.code) ? b.code : null;
  if (!email || !code) return json({ error: 'bad' }, 400);
  const wait = await limit([[`verify:ip:${clientIp(req.headers)}`, 3600, 30]]);
  if (wait) return tooMany(wait);
  // the attempt counts before the comparison, in one statement: parallel guesses can't share an attempt.
  // ponytail: anyone can spend a code's attempts, and 'wrong' vs 'expired' tells that a code is live; the price of
  // telling the person at the keyboard how many tries are left.
  const [row] = await db()`UPDATE login_codes SET attempts = attempts + 1
    WHERE email = ${email} AND expires_at > now() AND attempts < ${CODE_ATTEMPTS} RETURNING code_hash, attempts`;
  if (!row) return json({ error: 'expired' }, 400);
  if (!sameHash(row.code_hash, codeHash(secret(), email, code))) {
    const left = CODE_ATTEMPTS - row.attempts;
    if (!left) await db()`DELETE FROM login_codes WHERE email = ${email}`;
    return json({ error: 'wrong', attemptsLeft: left }, 400);
  }
  const [used] = await db()`DELETE FROM login_codes WHERE email = ${email} AND code_hash = ${row.code_hash} RETURNING 1 AS ok`;
  if (!used) return json({ error: 'expired' }, 400); // a parallel request used it first
  const [user] = await db()`INSERT INTO users (email) VALUES (${email}) ON CONFLICT (email) DO UPDATE SET last_seen_at = now() RETURNING id, name`;
  const token = newToken();
  await db().transaction([
    db()`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${tokenHash(token)}, ${user.id}, now() + make_interval(days => ${SESSION_DAYS}))`,
    db()`DELETE FROM sessions WHERE user_id = ${user.id} AND expires_at < now()`,
  ]);
  return json({ email, name: user.name ?? await giveName(user.id) }, 200, { 'Set-Cookie': sessionCookie(token, isSecure(req.url)) });
});

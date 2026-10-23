// The daily reminder (Web Push), the subscription's side. Anyone may subscribe; no account needed (if signed in, the
// account owns it and goes with it). The reminders themselves are sent by api/cron/reminders.js.
// GET /api/push → {key}: the VAPID public key, for pushManager.subscribe.
// POST /api/push {subscription, hour, tz, due, lang}: subscribes or updates (hour: local 0–23; tz: getTimezoneOffset()
// in minutes; due: cases due at the next reminder, null if unknown; lang: 'es' | 'en').
// DELETE /api/push {endpoint}: unsubscribes.
import { clientIp } from './_lib/rules.js';
import { body, db, json, limit, route, session, tooMany } from './_lib/server.js';
import { parseSubscription } from './_lib/push.js';

const isInt = (/** @type {unknown} */ n, /** @type {number} */ min, /** @type {number} */ max) => Number.isInteger(n) && /** @type {number} */ (n) >= min && /** @type {number} */ (n) <= max;

export const GET = route(async () => json({ key: process.env.VAPID_PUBLIC_KEY ?? null }));

/** @param {Request} req */
export const POST = route(async (req) => {
  const b = await body(req, 4096);
  const sub = parseSubscription(b?.subscription);
  const { hour, tz, due, lang } = b ?? {};
  if (!sub || !isInt(hour, 0, 23) || !isInt(tz, -840, 840) || !(due === null || isInt(due, 0, 100_000)) || (lang !== 'es' && lang !== 'en')) return json({ error: 'bad' }, 400);
  const wait = await limit([[`push:ip:${clientIp(req.headers)}`, 3600, 30]]);
  if (wait) return tooMany(wait);
  const s = await session(req);
  await db()`INSERT INTO push_subscriptions (endpoint, p256dh, auth, hour, tz_offset, due, lang, user_id)
    VALUES (${sub.endpoint}, ${sub.p256dh}, ${sub.auth}, ${hour}, ${tz}, ${due}, ${lang}, ${s?.id ?? null})
    ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, hour = EXCLUDED.hour, tz_offset = EXCLUDED.tz_offset,
      due = EXCLUDED.due, due_at = now(), lang = EXCLUDED.lang, user_id = coalesce(EXCLUDED.user_id, push_subscriptions.user_id)`;
  return json({ ok: true }, 200, s?.headers);
});

/** @param {Request} req */
export const DELETE = route(async (req) => {
  const endpoint = (await body(req, 2048))?.endpoint;
  if (typeof endpoint !== 'string') return json({ error: 'bad' }, 400);
  const wait = await limit([[`push:ip:${clientIp(req.headers)}`, 3600, 30]]);
  if (wait) return tooMany(wait);
  await db()`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
  return json({ ok: true });
});

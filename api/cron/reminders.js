// The daily reminder, sent: Vercel's cron (vercel.json) calls GET /api/cron/reminders at the top of every hour with
// Authorization: Bearer CRON_SECRET. Each subscription whose chosen local hour it is now gets one push (at most one a
// day), saying how many cases are due if the page told us lately; one the push service no longer knows or refuses is deleted.
import { sameHash } from '../_lib/rules.js';
import { db, json, route } from '../_lib/server.js';
import { reminderText, sendPush } from '../_lib/push.js';

const BATCH = 50; // pushes in flight at once
const TTL = 4 * 3600; // a phone offline for longer gets no stale reminder

/** @param {Request} req */
export const GET = route(async (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || !sameHash(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) return json({ error: 'auth' }, 401);
  // local hour = UTC minus the browser's offset; the due count (the page's guess for its next reminder) only if reported
  // since the last one was sent. Accounts' subscriptions first, then the oldest: a flood of new ones can't push them out.
  // ponytail: the offset is the one /hoy last sent, so after a DST change it's an hour off until /hoy opens again, and
  // the :30/:45 time zones (India, Nepal) get it that much after their hour; store an IANA zone if that matters.
  // ponytail: up to 2000 per run (one hour's subscribers); page through them if it ever gets there
  // Claimed (last_sent = now) before sending, so a cron run delivered twice can't send them twice; a failed send keeps
  // its claim: at most one try a day. `fresh`: never claimed before, so never delivered.
  const subs = await db()`WITH c AS (
      SELECT endpoint, last_sent IS NULL AS fresh,
        CASE WHEN due_at > now() - interval '2 days' AND (last_sent IS NULL OR due_at > last_sent) THEN due END AS due
      FROM push_subscriptions
      WHERE hour = mod(floor((extract(epoch FROM now()) / 60 - tz_offset) / 60)::bigint, 24)
        AND (last_sent IS NULL OR last_sent < now() - interval '20 hours')
      ORDER BY user_id IS NULL, created_at
      LIMIT 2000
      FOR UPDATE SKIP LOCKED
    )
    UPDATE push_subscriptions p SET last_sent = now() FROM c WHERE p.endpoint = c.endpoint
    RETURNING p.endpoint, p.p256dh, p.auth, p.lang, c.due, c.fresh`;
  /** @type {string[]} */ const sent = [];
  /** @type {string[]} */ const gone = [];
  /** @type {string[]} */ const refused = []; // a junk (or not ours) subscription; or our key / payload, if all of a service's are
  for (let i = 0; i < subs.length; i += BATCH) {
    await Promise.all(subs.slice(i, i + BATCH).map(async (s) => {
      const status = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, JSON.stringify({ ...reminderText(s.lang, s.due), url: '/hoy' }), TTL).catch(() => 0);
      if (status === 404 || status === 410) gone.push(s.endpoint);
      else if (status >= 200 && status < 300) sent.push(s.endpoint);
      else {
        if (status === 400 || status === 403) refused.push(s.endpoint);
        console.error('push', status, new URL(s.endpoint).host);
      }
    }));
  }
  // refused ones go where the same push service took others this run (then it's them, not our VAPID key), or if never
  // delivered: a made-up endpoint (a real one with our key took its first push) can't stay retried every day
  const works = new Set(sent.map((e) => new URL(e).host));
  const fresh = new Set(subs.flatMap((s) => (s.fresh ? [s.endpoint] : [])));
  gone.push(...refused.filter((e) => works.has(new URL(e).host) || fresh.has(e)));
  if (gone.length) await db()`DELETE FROM push_subscriptions WHERE endpoint = ANY(${gone})`;
  return json({ due: subs.length, sent: sent.length, gone: gone.length });
});

// The daily challenge: the same 3x3 scramble for everyone each UTC day (api/_lib/daily-scrambles.js, server only).
// GET /api/daily → {date, scramble, today, yesterday}: each a ranking {date, count, top, me} (today's top TOP, yesterday's
// final top TOP_YESTERDAY, `me` the signed-in account's entry wherever it ranks). Anyone may read it.
// POST /api/daily {date, ms, penalty, moves?} (signed in): the account's result of the day; only the first counts. With a
// smart cube's moves that solve the scramble it is "verified". Answers as GET, plus `saved` (false: one was sent before).
import { clientIp } from './_lib/rules.js';
import { body, db, json, limit, route, session, tooMany } from './_lib/server.js';
import { dayIndex, parseSubmission, TOP, TOP_YESTERDAY, utcDay, verify } from './_lib/daily.js';
import { SCRAMBLES, START } from './_lib/daily-scrambles.js';

const scrambleOf = (/** @type {string} */ day) => SCRAMBLES[dayIndex(day, START, SCRAMBLES.length)];

/** Today's challenge and the two rankings. @param {number} me the account's id (0: none) */
async function state(me) {
  const now = Date.now();
  const today = utcDay(now), yesterday = utcDay(now - 86_400_000);
  // ponytail: each read ranks the two days' results whole; a stored rank if a day ever gets thousands
  const rows = await db()`WITH r AS (
      SELECT d.day::text AS day, row_number() OVER (PARTITION BY d.day ORDER BY d.penalty = 'DNF', d.ms + CASE d.penalty WHEN '2000' THEN 2000 ELSE 0 END, d.at) AS rank,
        count(*) OVER (PARTITION BY d.day) AS n, d.user_id, u.name, d.ms, d.penalty, d.verified
      FROM daily_results d JOIN users u ON u.id = d.user_id WHERE d.day IN (${today}::date, ${yesterday}::date)
    )
    SELECT * FROM r WHERE rank <= CASE WHEN day = ${today} THEN ${TOP}::int ELSE ${TOP_YESTERDAY}::int END OR user_id = ${me}::int ORDER BY day, rank`;
  /** @param {Record<string, any>} r */
  const entry = (r) => ({ rank: Number(r.rank), name: r.name, ms: r.ms, penalty: r.penalty === 'DNF' ? 'DNF' : Number(r.penalty), verified: r.verified });
  /** @param {string} day @param {number} max */
  const board = (day, max) => {
    const of = rows.filter((r) => r.day === day);
    const mine = of.find((r) => r.user_id === me);
    return { date: day, count: Number(of[0]?.n ?? 0), top: of.filter((r) => Number(r.rank) <= max).map(entry), me: mine ? entry(mine) : null };
  };
  return { date: today, scramble: scrambleOf(today), today: board(today, TOP), yesterday: board(yesterday, TOP_YESTERDAY) };
}

// ponytail: each instance keeps the anonymous answer for ANON_MS, so a burst of public reads costs one query; a
// signed-in reader (their own rank) still runs it. A cache shared by instances if public reads ever outgrow that.
const ANON_MS = 20_000;
/** @type {{ at: number, state: ReturnType<typeof state> } | null} */
let anon = null;

/** @param {Request} req */
export const GET = route(async (req) => {
  const s = await session(req);
  if (s) return json(await state(s.id), 200, s.headers);
  if (!anon || Date.now() - anon.at > ANON_MS) {
    const mine = { at: Date.now(), state: state(0) };
    anon = mine;
    mine.state.catch(() => anon === mine && (anon = null)); // a failed read isn't kept
  }
  return json(await anon.state);
});

/** @param {Request} req */
export const POST = route(async (req) => {
  const s = await session(req);
  if (!s) return json({ error: 'auth' }, 401);
  const r = parseSubmission(await body(req, 32 * 1024));
  if (!r) return json({ error: 'bad' }, 400);
  const today = utcDay(Date.now());
  if (r.date !== today) return json({ error: 'day' }, 409); // played before midnight UTC: that challenge is over
  const wait = await limit([[`daily:user:${s.id}`, 3600, 10], [`daily:ip:${clientIp(req.headers)}`, 3600, 30]]);
  if (wait) return tooMany(wait);
  const verified = !!r.moves && (await verify(scrambleOf(today), r.moves, r.ms).catch(() => false));
  const saved = await db()`INSERT INTO daily_results (day, user_id, ms, penalty, verified) VALUES (${today}::date, ${s.id}, ${r.ms}, ${String(r.penalty)}, ${verified})
    ON CONFLICT DO NOTHING RETURNING 1`;
  if (saved.length) anon = null; // this instance's public board shows it right away
  return json({ ...(await state(s.id)), saved: saved.length > 0 }, 200, s.headers);
});

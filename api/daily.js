// The daily challenge: the same 3x3 scramble for everyone each UTC day (challenge_scrambles, made by db/scrambles.js). With
// ?week, the weekly one (api/_lib/weekly.js): 5 scrambles a week, ranked by their WCA average (one endpoint for both:
// the Hobby plan caps the number of functions). A scramble is only given at Jugar (POST ?play), never with the rankings:
// with the account, the first time it's seen is the attempt.
// GET /api/daily → {date, today, yesterday}: each a ranking {date, count, top, me} (today's top TOP, yesterday's final
// top TOP_YESTERDAY, `me` the signed-in account's entry wherever it ranks). Anyone may read it.
// POST /api/daily {date, ms, penalty, moves?, times?} (signed in): the account's result of the day; only the first counts.
// "Verified" (verify, api/_lib/daily.js) with a smart cube's log that solves the scramble at a human pace with times that
// end at the clock's stop, sent within inspection + its time + SEND_MS of the scramble's first play (POST ?play, at
// Jugar), and no sooner than its time after it. Answers as GET, plus
// `saved` (false: one was sent before). GET ?verified (also with ?week): the rankings of verified results only (with a
// play record: results verified before it existed, under weaker rules, are left out).
// POST /api/daily?play {date} or ?week&play {week, index} → {scramble}: anyone may play; with the account, the first
// time it's played is kept (challenge_plays).
// GET /api/daily?week → {week, board, last}: this week's ranking {week, count, top, me} and last week's final top; POST
// /api/daily?week {week, index, ms, penalty, moves?, times?}: one of the week's 5 solves, each the first sent.
import { clientIp } from './_lib/rules.js';
import { body, db, json, limit, route, session, tooMany } from './_lib/server.js';
import { dayIndex, parseSubmission, playedInTime, TOP, TOP_YESTERDAY, utcDay, verify } from './_lib/daily.js';
import { parseWeekly, parseWeekPlay, rank, scrambleIndex, TOP as TOP_WEEK, TOP_LAST, weekOf } from './_lib/weekly.js';

/** A challenge's scramble ('d:<day>' or 'w:<week>:<idx>', as challenge_plays): db/scrambles.js keeps a year of them
 * ahead; past that (no build in a year) the stored ones of its kind again, in order. null: none at all (the database's
 * migration never ran: npm run db:migrate). @param {string} key */
async function scrambleFor(key) {
  const rows = await db()`SELECT scramble FROM challenge_scrambles WHERE challenge = ${key}`;
  if (rows.length) return /** @type {string} */ (rows[0].scramble);
  const [kind, when, idx] = key.split(':');
  const [{ n }] = await db()`SELECT count(*)::int AS n FROM challenge_scrambles WHERE challenge LIKE ${kind + ':%'}`;
  if (!n) return null;
  const at = kind === 'd' ? dayIndex(when, '2026-01-05', n) : scrambleIndex(when, '2026-01-05', n, Number(idx)); // any fixed Monday
  const again = await db()`SELECT scramble FROM challenge_scrambles WHERE challenge LIKE ${kind + ':%'} ORDER BY challenge OFFSET ${at} LIMIT 1`;
  return again.length ? /** @type {string} */ (again[0].scramble) : null;
}
const unavailable = () => json({ error: 'unavailable' }, 503);

/** Today's challenge and the two rankings. @param {number} me the account's id (0: none) @param {boolean} only verified results */
async function state(me, only = false) {
  const now = Date.now();
  const today = utcDay(now), yesterday = utcDay(now - 86_400_000);
  // ponytail: each read ranks the two days' results whole; a stored rank if a day ever gets thousands
  const rows = await db()`WITH r AS (
      SELECT d.day::text AS day, row_number() OVER (PARTITION BY d.day ORDER BY d.penalty = 'DNF', d.ms + CASE d.penalty WHEN '2000' THEN 2000 ELSE 0 END, d.at) AS rank,
        count(*) OVER (PARTITION BY d.day) AS n, d.user_id, u.name, d.ms, d.penalty, d.verified
      FROM daily_results d JOIN users u ON u.id = d.user_id WHERE d.day IN (${today}::date, ${yesterday}::date) AND (NOT ${only}::boolean OR d.verified AND EXISTS (SELECT 1 FROM challenge_plays p WHERE p.user_id = d.user_id AND p.challenge = 'd:' || d.day::text))
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
  return { date: today, today: board(today, TOP), yesterday: board(yesterday, TOP_YESTERDAY) };
}

// ponytail: each instance keeps the anonymous answers for ANON_MS (by kind: day or week, all or verified only), so a
// burst of public reads costs one query each; a signed-in reader (their own rank) still runs it. A cache shared by
// instances if public reads ever outgrow that.
const ANON_MS = 20_000;
/** @type {Map<string, { at: number, state: Promise<unknown> }>} */
const anon = new Map();
/** The anonymous answer of `kind`, kept for ANON_MS (a failed read isn't). @param {string} kind @param {() => Promise<unknown>} read */
function cached(kind, read) {
  const hit = anon.get(kind);
  if (hit && Date.now() - hit.at <= ANON_MS) return hit.state;
  const mine = { at: Date.now(), state: read() };
  anon.set(kind, mine);
  mine.state.catch(() => anon.get(kind) === mine && anon.delete(kind));
  return mine.state;
}
const onlyVerified = (/** @type {Request} */ req) => new URL(req.url).searchParams.has('verified');
const isPlay = (/** @type {Request} */ req) => new URL(req.url).searchParams.has('play');

/** How long ago (ms) the account first played the challenge `key` (POST ?play), null if never: a verified result must
 *  be sent at least its time after. @param {number} user @param {string} key */
async function playedAgo(user, key) {
  const rows = await db()`SELECT extract(epoch FROM now() - at) * 1000 AS ago FROM challenge_plays WHERE user_id = ${user} AND challenge = ${key}`;
  return rows.length ? Number(rows[0].ago) : null;
}
/** The verified badge of a submission (see the top). @param {number} user @param {string} key @param {string} scramble
 * @param {{ ms: number, moves: string | null, times: number[] | null }} r */
async function verified(user, key, scramble, r) {
  if (!r.moves || !r.times) return false;
  const ago = await playedAgo(user, key);
  return playedInTime(ago, r.ms) && (await verify(scramble, r.moves, r.ms, r.times).catch(() => false));
}

/** POST ?play: the day's scramble (or one of the week's), played now; with the account, its first time is kept.
 * @param {Request} req */
async function postPlay(req) {
  const s = await session(req);
  const b = await body(req, 1024);
  const now = Date.now(), week = weekOf(now), today = utcDay(now);
  const key = isWeek(req) ? parseWeekPlay(b, week) : b?.date === today ? `d:${today}` : null;
  // a day or week that's over (a page left open past 00:00 UTC): the card fetches the new one
  if (!key) return /^\d{4}-\d{2}-\d{2}$/.test(String(isWeek(req) ? b?.week : b?.date)) ? json({ error: 'day' }, 409) : json({ error: 'bad' }, 400);
  const wait = await limit(s ? [[`play:user:${s.id}`, 3600, 60]] : [[`play:ip:${clientIp(req.headers)}`, 3600, 120]]);
  if (wait) return tooMany(wait);
  if (s) await db()`INSERT INTO challenge_plays (user_id, challenge) VALUES (${s.id}, ${key}) ON CONFLICT DO NOTHING`;
  const scramble = await scrambleFor(key);
  return scramble ? json({ scramble }, 200, s?.headers) : unavailable();
}


/** This week's challenge, its ranking and last week's. @param {number} me the account's id (0: none) @param {boolean} only verified solves */
async function weekState(me, only = false) {
  const now = Date.now();
  const week = weekOf(now), last = weekOf(Date.parse(week) - 1);
  const rows = /** @type {(Parameters<typeof rank>[0][number] & { week: string })[]} */ (await db()`SELECT w.week::text AS week, w.user_id, u.name, w.idx AS index, w.ms, w.penalty, w.verified, w.at
    FROM weekly_results w JOIN users u ON u.id = w.user_id WHERE w.week IN (${week}::date, ${last}::date) AND (NOT ${only}::boolean OR w.verified AND EXISTS (SELECT 1 FROM challenge_plays p WHERE p.user_id = w.user_id AND p.challenge = 'w:' || w.week::text || ':' || w.idx))`);
  const of = (/** @type {string} */ w) => rows.filter((r) => r.week === w);
  const mine = of(week).filter((r) => r.user_id === me).map((r) => ({ index: r.index, ms: r.ms, penalty: r.penalty === 'DNF' ? 'DNF' : Number(r.penalty) }));
  return { week, board: { ...rank(of(week), TOP_WEEK, me), solves: mine }, last: { week: last, ...rank(of(last), TOP_LAST, me) } };
}
const isWeek = (/** @type {Request} */ req) => new URL(req.url).searchParams.has('week');

/** @param {Request} req */
async function getWeek(req) {
  const s = await session(req), only = onlyVerified(req);
  if (s) return json(await weekState(s.id, only), 200, s.headers);
  return json(await cached(`week:${only}`, () => weekState(0, only)));
}

/** @param {Request} req */
async function postWeek(req) {
  const s = await session(req);
  if (!s) return json({ error: 'auth' }, 401);
  const r = parseWeekly(await body(req, 32 * 1024));
  if (!r) return json({ error: 'bad' }, 400);
  const week = weekOf(Date.now());
  if (r.week !== week) return json({ error: 'day' }, 409); // played before Monday 00:00 UTC: that week is over
  const wait = await limit([[`weekly:user:${s.id}`, 3600, 20], [`weekly:ip:${clientIp(req.headers)}`, 3600, 60]]);
  if (wait) return tooMany(wait);
  const key = `w:${week}:${r.index}`, scramble = await scrambleFor(key);
  if (!scramble) return unavailable();
  const ok = await verified(s.id, key, scramble, r);
  const saved = await db()`INSERT INTO weekly_results (week, user_id, idx, ms, penalty, verified) VALUES (${week}::date, ${s.id}, ${r.index}, ${r.ms}, ${String(r.penalty)}, ${ok})
    ON CONFLICT DO NOTHING RETURNING 1`;
  if (saved.length) anon.clear();
  return json({ ...(await weekState(s.id)), saved: saved.length > 0 }, 200, s.headers);
}

/** @param {Request} req */
export const GET = route(async (req) => {
  if (isWeek(req)) return getWeek(req);
  const s = await session(req), only = onlyVerified(req);
  if (s) return json(await state(s.id, only), 200, s.headers);
  return json(await cached(`day:${only}`, () => state(0, only)));
});

/** @param {Request} req */
export const POST = route(async (req) => {
  if (isPlay(req)) return postPlay(req);
  if (isWeek(req)) return postWeek(req);
  const s = await session(req);
  if (!s) return json({ error: 'auth' }, 401);
  const r = parseSubmission(await body(req, 32 * 1024));
  if (!r) return json({ error: 'bad' }, 400);
  const today = utcDay(Date.now());
  if (r.date !== today) return json({ error: 'day' }, 409); // played before midnight UTC: that challenge is over
  const wait = await limit([[`daily:user:${s.id}`, 3600, 10], [`daily:ip:${clientIp(req.headers)}`, 3600, 30]]);
  if (wait) return tooMany(wait);
  const scramble = await scrambleFor(`d:${today}`);
  if (!scramble) return unavailable();
  const ok = await verified(s.id, `d:${today}`, scramble, r);
  const saved = await db()`INSERT INTO daily_results (day, user_id, ms, penalty, verified) VALUES (${today}::date, ${s.id}, ${r.ms}, ${String(r.penalty)}, ${ok})
    ON CONFLICT DO NOTHING RETURNING 1`;
  if (saved.length) anon.clear(); // this instance's public boards show it right away
  return json({ ...(await state(s.id)), saved: saved.length > 0 }, 200, s.headers);
});

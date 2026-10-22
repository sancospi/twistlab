// The account's API, the pure part: email and code checks, the session cookie, rate-limit decisions and the pushed
// progress's validation. The database side is server.js; the routes are api/**/*.js (files under _lib are not routes).
// Plain JS with JSDoc types: Vercel can't compile TypeScript with the project's TypeScript 7.
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { inBackup } from '../../src/backup-keys.js';

export const CODE_MINUTES = 10;
export const CODE_ATTEMPTS = 5;
export const SESSION_DAYS = 90;
export const COOKIE = 'tl_session';
export const MAX_VALUE = 512 * 1024; // bytes, per key
export const MAX_REQUEST = 2 * 1024 * 1024;
export const MAX_TOTAL = 5 * 1024 * 1024; // per account
export const MAX_KEYS = 400;

// The HTML spec's own check (what <input type=email> accepts), on the lowercased address
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** The address trimmed and lowercased, if it is one (≤ 254 characters); else null.
 * @param {unknown} raw */
export function normalizeEmail(raw) {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

/** The inbox an address delivers to, for the per-address limits: without a +tag, and for Gmail without dots.
 * @param {string} email a normalized address */
export function inbox(email) {
  const at = email.lastIndexOf('@');
  const local = email.slice(0, at).split('+')[0], domain = email.slice(at + 1);
  return domain === 'gmail.com' || domain === 'googlemail.com' ? `${local.replaceAll('.', '')}@gmail.com` : `${local}@${domain}`;
}

/** A 6-digit code, uniformly random. */
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

/** What is stored of a code: an HMAC with the server's secret, bound to its email.
 * @param {string} secret @param {string} email @param {string} code */
export const codeHash = (secret, email, code) => createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');

/** Constant-time comparison of two hashes.
 * @param {string} a @param {string} b */
export function sameHash(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A session token (the cookie) and what is stored of it. */
export const newToken = () => randomBytes(32).toString('base64url');
/** @param {string} token */
export const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

/** Secure everywhere but plain-http localhost (the dev server).
 * @param {string} url */
export function isSecure(url) {
  const u = new URL(url);
  return !(u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1'));
}

/** The Set-Cookie of a session (`token` null: clears it).
 * @param {string | null} token @param {boolean} secure */
export const sessionCookie = (token, secure) =>
  `${COOKIE}=${token ?? ''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? SESSION_DAYS * 86_400 : 0}${secure ? '; Secure' : ''}`;

/** A cookie's value from the Cookie header, or null.
 * @param {string | null} header @param {string} [name] */
export function readCookie(header, name = COOKIE) {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim() || null;
  }
  return null;
}

/** The client's address: the first hop of x-forwarded-for (Vercel sets it), else x-real-ip.
 * @param {Headers} headers */
export const clientIp = (headers) => headers.get('x-forwarded-for')?.split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';

/** CSRF: a POST must come from a page of this site (its Origin is the Host); only a GET may come without Origin.
 * @param {string} method @param {string | null} origin @param {string | null} host */
export function sameOrigin(method, origin, host) {
  if (!origin) return method === 'GET';
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Rate limits, given each rule's events in its window (n), its max and the seconds until its oldest event leaves the
 * window: 0 = allowed, else the seconds to wait (at least 1).
 * @param {{ n: number, max: number, expiresIn: number }[]} rules */
export function retryAfter(rules) {
  let wait = 0;
  for (const r of rules) if (r.n >= r.max) wait = Math.max(wait, 1, Math.ceil(r.expiresIn));
  return wait;
}

/** @typedef {{ k: string, v: string | null, t: number, b: number }} Row */

/** The pushed items ({key: {v, t, b}}) as rows, if every key is this app's (backup-keys.js), every value a string of at
 * most MAX_VALUE bytes or null (deleted), t the new version and b the version it replaces (0: none); else null.
 * @param {unknown} items @returns {Row[] | null} */
export function parseItems(items) {
  if (!items || typeof items !== 'object' || Array.isArray(items)) return null;
  /** @type {Row[]} */
  const rows = [];
  for (const [k, item] of Object.entries(items)) {
    if (!inBackup(k) || k.length > 200 || !item || typeof item !== 'object') return null;
    const { v, t, b } = /** @type {{ v: unknown, t: number, b: number }} */ (item); // checked here
    if (!(v === null || (typeof v === 'string' && Buffer.byteLength(v) <= MAX_VALUE))) return null;
    if (!Number.isSafeInteger(b) || !Number.isSafeInteger(t) || b < 0 || t <= b) return null;
    rows.push({ k, v, t, b });
  }
  return rows.length <= MAX_KEYS ? rows : null;
}

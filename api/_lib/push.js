// Web Push without a library: the VAPID signature (RFC 8292) and the payload's encryption (RFC 8291, aes128gcm), with
// node:crypto. VAPID_PUBLIC_KEY is the uncompressed P-256 point and VAPID_PRIVATE_KEY its 32-byte scalar, both
// base64url (the web-push library's format). The routes are api/push.js and api/cron/reminders.js.
import { createCipheriv, createECDH, createPrivateKey, hkdfSync, randomBytes, sign } from 'node:crypto';

// Only the browsers' push services: the cron posts to these URLs, so a subscription can't point it anywhere else
const SERVICES = /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)\//;
const B64URL = /^[A-Za-z0-9_-]+$/;

/** @typedef {{ endpoint: string, p256dh: string, auth: string }} Subscription */

/** A PushSubscription's JSON as stored, if it is one of a known push service; else null.
 * @param {unknown} raw @returns {Subscription | null} */
export function parseSubscription(raw) {
  const { endpoint, keys } = /** @type {{ endpoint?: unknown, keys?: { p256dh?: unknown, auth?: unknown } }} */ (raw ?? {});
  const { p256dh, auth } = keys ?? {};
  if (typeof endpoint !== 'string' || endpoint.length > 1000 || !SERVICES.test(endpoint)) return null;
  if (typeof p256dh !== 'string' || !B64URL.test(p256dh) || Buffer.from(p256dh, 'base64url').length !== 65) return null;
  if (typeof auth !== 'string' || !B64URL.test(auth) || Buffer.from(auth, 'base64url').length !== 16) return null;
  return { endpoint, p256dh, auth };
}

/** The Authorization header of a push to `endpoint`: a JWT signed with the VAPID key, valid for 12 hours.
 * @param {string} endpoint @param {string} publicKey @param {string} privateKey @param {number} now ms */
export function vapidAuth(endpoint, publicKey, privateKey, now) {
  const pub = Buffer.from(publicKey, 'base64url');
  const key = createPrivateKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', d: privateKey,
    x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33, 65).toString('base64url') } });
  const part = (/** @type {object} */ o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const data = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: 'https://twistlab.app' })}`;
  const sig = sign('sha256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `vapid t=${data}.${sig}, k=${publicKey}`;
}

/** The body of a push: `payload` encrypted for the subscription (one aes128gcm record).
 * @param {Subscription} sub @param {string} payload */
export function encrypt(sub, payload) {
  const ua = Buffer.from(sub.p256dh, 'base64url');
  const ecdh = createECDH('prime256v1');
  const as = ecdh.generateKeys();
  const salt = randomBytes(16);
  const ikm = hkdfSync('sha256', ecdh.computeSecret(ua), Buffer.from(sub.auth, 'base64url'), Buffer.concat([Buffer.from('WebPush: info\0'), ua, as]), 32);
  const cek = hkdfSync('sha256', ikm, salt, 'Content-Encoding: aes128gcm\0', 16);
  const nonce = hkdfSync('sha256', ikm, salt, 'Content-Encoding: nonce\0', 12);
  const cipher = createCipheriv('aes-128-gcm', Buffer.from(cek), Buffer.from(nonce));
  const body = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]); // 2: the last record
  const head = Buffer.alloc(21);
  salt.copy(head);
  head.writeUInt32BE(4096, 16); // record size
  head[20] = as.length;
  return Buffer.concat([head, as, body]);
}

/** Sends one push; resolves to the push service's status (201 = accepted; 404/410 = the subscription is gone).
 * @param {Subscription} sub @param {string} payload @param {number} ttl seconds the service may hold it */
export async function sendPush(sub, payload, ttl) {
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidAuth(sub.endpoint, /** @type {string} */ (process.env.VAPID_PUBLIC_KEY), /** @type {string} */ (process.env.VAPID_PRIVATE_KEY), Date.now()),
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: String(ttl), Urgency: 'normal',
    },
    body: encrypt(sub, payload),
  });
  return res.status;
}

/** The reminder's text, in the subscription's language; with the cases due when it is known.
 * @param {string} lang @param {number | null} due */
export function reminderText(lang, due) {
  if (lang === 'pt') {
    const body = due ? `${due} ${due === 1 ? 'caso espera' : 'casos esperam'} por você na revisão de hoje.` : 'Dez minutos hoje e seus algoritmos continuam frescos.';
    return { title: 'Hora de praticar', body };
  }
  const en = lang === 'en';
  const body = due ? (en ? `${due} ${due === 1 ? 'case is' : 'cases are'} waiting in today's review.` : `${due} ${due === 1 ? 'caso te espera' : 'casos te esperan'} en el repaso de hoy.`)
    : (en ? 'Ten minutes today keep your algorithms fresh.' : 'Diez minutos hoy y tus algoritmos siguen frescos.');
  return { title: en ? 'Time to practice' : 'Hora de practicar', body };
}

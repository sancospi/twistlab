// The daily reminder's Web Push (api/_lib/push.js): the browser's side of RFC 8291 decrypts what encrypt() sends, and
// the VAPID JWT verifies with the public key.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from 'node:crypto';
import { encrypt, parseSubscription, reminderText, vapidAuth } from '../api/_lib/push.js';

test('encrypt: one aes128gcm record the subscriber decrypts', () => {
  const ua = createECDH('prime256v1');
  const uaPublic = ua.generateKeys();
  const auth = randomBytes(16);
  const body = encrypt({ endpoint: 'https://fcm.googleapis.com/fcm/send/x', p256dh: uaPublic.toString('base64url'), auth: auth.toString('base64url') }, '{"title":"¡Hola!"}');
  const salt = body.subarray(0, 16), rs = body.readUInt32BE(16), idlen = body[20], as = body.subarray(21, 21 + idlen);
  assert.equal(rs, 4096);
  assert.equal(idlen, 65);
  const ikm = hkdfSync('sha256', ua.computeSecret(as), auth, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, as]), 32);
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, 'Content-Encoding: aes128gcm\0', 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, 'Content-Encoding: nonce\0', 12));
  const data = body.subarray(21 + idlen);
  const d = createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(data.subarray(-16));
  const plain = Buffer.concat([d.update(data.subarray(0, -16)), d.final()]);
  assert.equal(plain.at(-1), 2); // the last record's delimiter
  assert.equal(plain.subarray(0, -1).toString(), '{"title":"¡Hola!"}');
});

test('vapidAuth: an ES256 JWT for the push service, with the public key', () => {
  const k = createECDH('prime256v1');
  const pub = k.generateKeys().toString('base64url'), priv = k.getPrivateKey().toString('base64url');
  const header = vapidAuth('https://web.push.apple.com/abc', pub, priv, 1_000_000_000_000);
  const [, jwt, key] = /^vapid t=([^,]+), k=(.+)$/.exec(header)!;
  assert.equal(key, pub);
  const [h, p, sig] = jwt.split('.');
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  assert.equal(claims.aud, 'https://web.push.apple.com');
  assert.equal(claims.exp, 1_000_000_000 + 12 * 3600);
  const raw = Buffer.from(pub, 'base64url');
  const pk = createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: raw.subarray(1, 33).toString('base64url'), y: raw.subarray(33).toString('base64url') } });
  assert.ok(verify('sha256', Buffer.from(`${h}.${p}`), { key: pk, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url')));
});

test('parseSubscription: only the browsers\' push services, with keys of the right size', () => {
  const keys = { p256dh: Buffer.alloc(65, 4).toString('base64url'), auth: Buffer.alloc(16, 1).toString('base64url') };
  for (const endpoint of ['https://fcm.googleapis.com/fcm/send/a', 'https://web.push.apple.com/b', 'https://updates.push.services.mozilla.com/wpush/v2/c', 'https://wns2-par02p.notify.windows.com/w/?token=d']) {
    assert.deepEqual(parseSubscription({ endpoint, keys }), { endpoint, ...keys });
  }
  for (const endpoint of ['http://fcm.googleapis.com/x', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://169.254.169.254/']) {
    assert.equal(parseSubscription({ endpoint, keys }), null);
  }
  const endpoint = 'https://fcm.googleapis.com/fcm/send/a';
  assert.equal(parseSubscription({ endpoint, keys: { ...keys, auth: 'short' } }), null);
  assert.equal(parseSubscription({ endpoint, keys: { ...keys, p256dh: 'a+b/' } }), null);
  assert.equal(parseSubscription(null), null);
});

test('reminderText: the due cases when known, else a nudge; Spanish unless English', () => {
  assert.equal(reminderText('es', 3).body, '3 casos te esperan en el repaso de hoy.');
  assert.equal(reminderText('en', 1).body, "1 case is waiting in today's review.");
  assert.match(reminderText('es', null).body, /Diez minutos/);
  assert.equal(reminderText('en', 0).title, 'Time to practice');
});

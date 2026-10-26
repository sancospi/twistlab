// The account API's pure rules (api/_lib/rules.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clientIp, codeHash, inbox, isSecure, MAX_KEYS, MAX_VALUE, newCode, newToken, normalizeEmail, parseItems, readCookie, retryAfter, sameHash,
  sameOrigin, sessionCookie, tokenHash,
} from '../api/_lib/rules.js';
import { inBackup } from './progress.ts';

test('email: trimmed, lowercased, one address, at most 254 characters', () => {
  assert.equal(normalizeEmail('  Ana.Pérez@x.co '), null); // not ASCII: the HTML spec's check refuses it too
  assert.equal(normalizeEmail('  Test+1@Example.COM '), 'test+1@example.com');
  for (const bad of [null, 1, '', 'a', 'a@', '@b.co', 'a@b', 'a b@c.co', 'a@b..co', 'a@-b.co', 'a@b.co,c@d.co', `${'a'.repeat(250)}@b.co`]) assert.equal(normalizeEmail(bad), null, String(bad));
});

test('inbox: the per-address limits count +tags and Gmail dots as the same address', () => {
  assert.equal(inbox('ana+1@example.com'), 'ana@example.com');
  assert.equal(inbox('a.na+x@googlemail.com'), 'ana@gmail.com');
  assert.equal(inbox('a.na@example.com'), 'a.na@example.com');
});

test('codes: 6 digits; the stored hash is bound to the email and compared in constant time', () => {
  for (let i = 0; i < 50; i++) assert.match(newCode(), /^\d{6}$/);
  const h = codeHash('s', 'a@b.co', '123456');
  assert.ok(sameHash(h, codeHash('s', 'a@b.co', '123456')));
  assert.ok(!sameHash(h, codeHash('s', 'c@b.co', '123456')));
  assert.ok(!sameHash(h, codeHash('other', 'a@b.co', '123456')));
  assert.ok(!sameHash(h, h.slice(1)));
});

test('session cookie: HttpOnly, Lax, 90 days, Secure but on http://localhost; read back from a Cookie header', () => {
  const token = newToken();
  assert.match(token, /^[\w-]{43}$/);
  assert.equal(tokenHash(token).length, 64);
  assert.equal(sessionCookie(token, true), `tl_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7776000; Secure`);
  assert.equal(sessionCookie(null, false), 'tl_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  assert.ok(isSecure('https://twistlab.app/api/me'));
  assert.ok(!isSecure('http://localhost:4318/api/me'));
  assert.ok(isSecure('http://example.com/api/me'));
  assert.equal(readCookie(`a=1; tl_session=${token}; b=2`), token);
  assert.equal(readCookie('xtl_session=1; tl_session='), null);
  assert.equal(readCookie(null), null);
});

test('same origin: a POST needs an Origin of this host; a GET may come without one', () => {
  assert.ok(sameOrigin('POST', 'https://twistlab.app', 'twistlab.app'));
  assert.ok(!sameOrigin('POST', 'https://evil.app', 'twistlab.app'));
  assert.ok(!sameOrigin('POST', null, 'twistlab.app'));
  assert.ok(!sameOrigin('POST', 'null', 'twistlab.app'));
  assert.ok(sameOrigin('GET', null, 'twistlab.app'));
  assert.ok(!sameOrigin('GET', 'https://evil.app', 'twistlab.app'));
});

test('client IP: the first hop of x-forwarded-for, else x-real-ip', () => {
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1', 'x-real-ip': '5.6.7.8' })), '1.2.3.4');
  assert.equal(clientIp(new Headers({ 'x-real-ip': '5.6.7.8' })), '5.6.7.8');
});

test('rate limits: allowed under every max; else the longest wait among the rules over it', () => {
  assert.equal(retryAfter([{ n: 0, max: 1, expiresIn: 0 }, { n: 4, max: 5, expiresIn: 100 }]), 0);
  assert.equal(retryAfter([{ n: 1, max: 1, expiresIn: 42.2 }, { n: 4, max: 5, expiresIn: 3000 }]), 43);
  assert.equal(retryAfter([{ n: 1, max: 1, expiresIn: 42 }, { n: 5, max: 5, expiresIn: 3000 }]), 3000);
  assert.equal(retryAfter([{ n: 1, max: 1, expiresIn: -0.5 }]), 1); // at the edge: still at least a second
});

test('pushed progress: only this app\'s keys (the backup\'s allowlist), string or null values, a newer version', () => {
  const item = { v: '[]', t: 2, b: 1 };
  assert.deepEqual(parseItems({ 'cube-results': item, 'progress-goal': { v: null, t: 5, b: 0 } }),
    [{ k: 'cube-results', v: '[]', t: 2, b: 1 }, { k: 'progress-goal', v: null, t: 5, b: 0 }]);
  for (const k of ['lang', 'last-page', 'sync-meta', 'cube-mac:GAN', 'other-app']) {
    assert.equal(inBackup(k), false);
    assert.equal(parseItems({ [k]: item }), null, k);
  }
  for (const bad of [null, [], 'x', { 'cube-x': { v: 1, t: 2, b: 1 } }, { 'cube-x': { v: 'a', t: 1, b: 1 } }, { 'cube-x': { v: 'a', t: 2 } },
    { 'cube-x': { v: 'a', t: 2.5, b: 1 } }, { 'cube-x': { v: 'a', t: 2, b: -1 } }, { 'cube-x': { v: 'é'.repeat(MAX_VALUE / 2 + 1), t: 2, b: 1 } }]) {
    assert.equal(parseItems(bad), null, JSON.stringify(bad)?.slice(0, 60));
  }
  assert.equal(parseItems(Object.fromEntries(Array.from({ length: MAX_KEYS + 1 }, (_, i) => [`cube-${i}`, item]))), null);
  assert.equal(parseItems({ 'cube-x': { v: 'a'.repeat(MAX_VALUE), t: 2, b: 1 } })?.length, 1);
});

// The account API's server part that needs no database (api/_lib/server.js): body() and route() take a Request and
// give a Response or a value. db() is never called here; it is not mocked either, a fake SQL tag would test itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { body, clearCookie, json, route, tooMany } from '../api/_lib/server.js';

const post = (text: string, headers: Record<string, string> = {}) =>
  new Request('https://twistlab.app/api/x', { method: 'POST', body: text, headers: { 'content-type': 'application/json', ...headers } });

test('body: a JSON object up to max bytes; anything else is null', async () => {
  assert.deepEqual(await body(post('{"a":1}'), 100), { a: 1 });
  assert.deepEqual(await body(post('{"a":1}', { 'content-type': 'application/json; charset=utf-8' }), 100), { a: 1 });
  assert.equal(await body(post('{"a":1}', { 'content-type': 'text/plain' }), 100), null); // a form can send text/plain cross-site
  assert.equal(await body(new Request('https://twistlab.app/api/x', { method: 'POST', body: '{"a":1}' }), 100), null);
  assert.equal(await body(post('{"a":1}', { 'content-length': '101' }), 100), null); // refused before reading it
  assert.equal(await body(post(`{"a":"${'é'.repeat(50)}"}`), 100), null); // 50 characters, 100+ bytes
  for (const bad of ['[1]', 'null', '1', '"a"', 'true', '{', '']) assert.equal(await body(post(bad), 100), null, bad);
});

test('route: other origins get 403 without running the handler; a thrown error is a generic 500', async (t) => {
  let ran = 0;
  const ok = route(async () => (ran++, json({ ok: true })));
  const req = (method: string, headers: Record<string, string>) => new Request('https://twistlab.app/api/x', { method, headers: { host: 'twistlab.app', ...headers } });
  for (const [method, headers] of [['POST', { origin: 'https://evil.app' }], ['POST', {}], ['GET', { origin: 'https://evil.app' }]] as const) {
    const res = await ok(req(method, headers));
    assert.equal(res.status, 403);
    assert.deepEqual(await res.json(), { error: 'origin' });
  }
  assert.equal(ran, 0);
  assert.equal((await ok(req('POST', { origin: 'https://twistlab.app' }))).status, 200);
  assert.equal((await ok(req('GET', {}))).status, 200);
  assert.equal(ran, 2);

  t.mock.method(console, 'error', () => {}); // route logs it
  const res = await route(async () => { throw new Error('secret detail'); })(req('GET', {}));
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: 'server' });
});

test('json and tooMany: never cached; 429 says how long to wait', async () => {
  const res = json({ a: 1 }, 201, { 'X-A': 'b' });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-a'), 'b');
  const r = tooMany(30);
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '30');
  assert.deepEqual(await r.json(), { error: 'rate', retryAfter: 30 });
  assert.match(clearCookie(new Request('https://twistlab.app/api/x'))['Set-Cookie'], /Max-Age=0/i);
});

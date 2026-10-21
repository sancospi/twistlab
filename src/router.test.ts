import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routePath, type Route } from './router.ts';

test('routes: each screen has its path, and paths round-trip', () => {
  const routes: Route[] = [
    { mod: 'solve' },
    { mod: 'cube' },
    { mod: 'academy', page: { kind: 'home' } },
    { mod: 'academy', page: { kind: 'notation' } },
    { mod: 'academy', page: { kind: 'cross' } },
    { mod: 'academy', page: { kind: 'method', id: 'cfop-reducido' } },
  ];
  for (const r of routes) assert.deepEqual(parseRoute(routePath(r)), r);
  assert.equal(routePath({ mod: 'academy', page: { kind: 'method', id: 'cfop-reducido' } }), '/academia/cfop-reducido');
  assert.equal(routePath({ mod: 'academy', page: { kind: 'notation' } }), '/academia/notacion');
  assert.equal(routePath({ mod: 'academy', page: { kind: 'cross' } }), '/academia/cruz');
  assert.deepEqual(parseRoute('/academia/cruz/'), { mod: 'academy', page: { kind: 'cross' } });
});

test('routes: trailing slashes, the old /resolver and unknown paths', () => {
  assert.deepEqual(parseRoute('/academia/'), { mod: 'academy', page: { kind: 'home' } });
  assert.deepEqual(parseRoute('/academia/cfop-reducido/'), { mod: 'academy', page: { kind: 'method', id: 'cfop-reducido' } });
  assert.deepEqual(parseRoute('/resolver'), { mod: 'solve' });
  assert.deepEqual(parseRoute('/guia'), { mod: 'cube' }); // the old Guía now lives in the Cubo screen
  assert.equal(routePath({ mod: 'cube' }), '/cubo');
  assert.deepEqual(parseRoute('/index.html'), { mod: 'solve' });
  assert.deepEqual(parseRoute('/algo/raro'), { mod: 'solve' });
  assert.deepEqual(parseRoute('/academia/no-existe'), { mod: 'academy', page: { kind: 'method', id: 'no-existe' } }); // the page says "not found"
});

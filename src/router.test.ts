import test from 'node:test';
import assert from 'node:assert/strict';
import { guidePage, guideSegment, parseRoute, routePath, type Route } from './router.ts';

test('routes: each screen has its path, and paths round-trip', () => {
  const routes: Route[] = [
    { mod: 'solve' },
    { mod: 'cube' },
    { mod: 'cube', page: 'paint' },
    { mod: 'progress' },
    { mod: 'academy', page: { kind: 'home' } },
    { mod: 'academy', page: { kind: 'notation' } },
    { mod: 'academy', page: { kind: 'cross' } },
    { mod: 'academy', page: { kind: 'method', id: 'cfop-reducido' } },
    { mod: 'academy', page: { kind: 'lesson', course: 'cruz', id: 'que-es' } },
    { mod: 'academy', page: { kind: 'lesson', course: 'notacion', id: 'caras' } },
    { mod: 'academy', page: { kind: 'lesson', course: 'principiante', id: 'capa1' } },
    { mod: 'academy', page: { kind: 'library' } },
    { mod: 'academy', page: { kind: 'case', method: 'cfop-completo', id: 'cfopc-oll-27' } },
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
  assert.equal(routePath({ mod: 'cube', page: 'paint' }), '/cubo/pintar');
  assert.deepEqual(parseRoute('/cubo/pintar/'), { mod: 'cube', page: 'paint' });
  assert.deepEqual(parseRoute('/cubo/otra'), { mod: 'cube' });
  assert.equal(routePath({ mod: 'progress' }), '/progreso');
  assert.deepEqual(parseRoute('/progreso/'), { mod: 'progress' });
  assert.deepEqual(parseRoute('/index.html'), { mod: 'solve' });
  assert.deepEqual(parseRoute('/algo/raro'), { mod: 'solve' });
  assert.deepEqual(parseRoute('/academia/no-existe'), { mod: 'academy', page: { kind: 'method', id: 'no-existe' } }); // the page says "not found"
});

test('routes: lessons hang from their guide', () => {
  assert.equal(routePath({ mod: 'academy', page: { kind: 'lesson', course: 'notacion', id: 'caras' } }), '/academia/notacion/leccion/caras');
  assert.deepEqual(parseRoute('/academia/principiante/leccion/capa1/'), { mod: 'academy', page: { kind: 'lesson', course: 'principiante', id: 'capa1' } });
  assert.deepEqual(parseRoute('/academia/cruz/leccion'), { mod: 'academy', page: { kind: 'cross' } }); // no lesson: the guide
  assert.deepEqual(guidePage('notacion'), { kind: 'notation' });
  assert.deepEqual(guidePage('principiante'), { kind: 'method', id: 'principiante' });
  for (const s of ['notacion', 'cruz', 'principiante']) assert.equal(guideSegment(guidePage(s)), s);
});

test('routes: the algorithm library, and each case page under its method', () => {
  assert.equal(routePath({ mod: 'academy', page: { kind: 'library' } }), '/algoritmos');
  assert.deepEqual(parseRoute('/algoritmos/'), { mod: 'academy', page: { kind: 'library' } });
  assert.deepEqual(parseRoute('/academia/algoritmos'), { mod: 'academy', page: { kind: 'library' } }); // the old path (rewritten by go())
  assert.equal(routePath({ mod: 'academy', page: { kind: 'case', method: 'cfop-reducido', id: 'cfop-f2l-a1' } }), '/academia/cfop-reducido/caso/cfop-f2l-a1');
  assert.deepEqual(parseRoute('/academia/cfop-completo/caso/cfopc-pll-t/'), { mod: 'academy', page: { kind: 'case', method: 'cfop-completo', id: 'cfopc-pll-t' } });
  assert.deepEqual(parseRoute('/academia/cfop-completo/caso'), { mod: 'academy', page: { kind: 'method', id: 'cfop-completo' } }); // no case: the method
  assert.doesNotThrow(() => parseRoute('/academia/cfop-completo/caso/%E0%A4')); // bad percent-encoding
});

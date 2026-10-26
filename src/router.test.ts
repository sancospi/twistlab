import test from 'node:test';
import assert from 'node:assert/strict';
import { guidePage, guideSegment, localHref, navigate, openSheet, parseRoute, routePath, startRouter, type Route } from './router.ts';
import { langPath } from './i18n.ts';

test('routes: each screen has its path, and paths round-trip', () => {
  const routes: Route[] = [
    { mod: 'solve' },
    { mod: 'cube' },
    { mod: 'cube', page: 'paint' },
    { mod: 'progress' },
    { mod: 'about' },
    { mod: 'academy', page: { kind: 'home' } },
    { mod: 'academy', page: { kind: 'notation' } },
    { mod: 'academy', page: { kind: 'cross' } },
    { mod: 'academy', page: { kind: 'bases2x2' } },
    { mod: 'academy', page: { kind: 'triggers' } },
    { mod: 'academy', page: { kind: 'method', id: 'cfop-reducido' } },
    { mod: 'academy', page: { kind: 'method', id: 'ortega' } },
    { mod: 'academy', page: { kind: 'lesson', course: '2x2', id: 'que-es' } },
    { mod: 'academy', page: { kind: 'lesson', course: 'cruz', id: 'que-es' } },
    { mod: 'academy', page: { kind: 'lesson', course: 'notacion', id: 'caras' } },
    { mod: 'academy', page: { kind: 'lesson', course: 'principiante', id: 'capa1' } },
    { mod: 'academy', page: { kind: 'library' } },
    { mod: 'academy', page: { kind: 'today' } },
    { mod: 'academy', page: { kind: 'case', method: 'cfop-completo', id: 'cfopc-oll-27' } },
    { mod: 'academy', page: { kind: 'trainer', id: 'reconocer-pll' } },
    { mod: 'academy', page: { kind: 'trainer', id: 'auf' } },
    { mod: 'academy', page: { kind: 'trainer', id: 'anticipacion' } },
    { mod: 'academy', page: { kind: 'howto' } },
    { mod: 'academy', page: { kind: 'smartcubes' } },
  ];
  for (const r of routes) {
    assert.deepEqual(parseRoute(routePath(r)), r);
    for (const l of ['en', 'pt'] as const) assert.deepEqual(parseRoute(langPath(routePath(r), l)), r, `${l} ${routePath(r)}`); // same slugs under /en, /pt
  }
  assert.equal(routePath({ mod: 'academy', page: { kind: 'method', id: 'cfop-reducido' } }), '/academia/cfop-reducido');
  assert.equal(routePath({ mod: 'academy', page: { kind: 'notation' } }), '/academia/notacion');
  assert.equal(routePath({ mod: 'academy', page: { kind: 'cross' } }), '/academia/cruz');
  assert.deepEqual(parseRoute('/academia/cruz/'), { mod: 'academy', page: { kind: 'cross' } });
  assert.equal(routePath({ mod: 'academy', page: { kind: 'bases2x2' } }), '/academia/2x2');
  assert.deepEqual(guidePage('2x2'), { kind: 'bases2x2' });
  assert.equal(routePath({ mod: 'academy', page: { kind: 'triggers' } }), '/academia/gatillos');
  assert.deepEqual(parseRoute('/academia/gatillos/'), { mod: 'academy', page: { kind: 'triggers' } });
  assert.equal(routePath({ mod: 'academy', page: { kind: 'howto' } }), '/como-resolver-el-cubo-de-rubik');
  assert.equal(routePath({ mod: 'academy', page: { kind: 'smartcubes' } }), '/cubos-inteligentes');
  assert.equal(routePath({ mod: 'academy', page: { kind: 'today' } }), '/hoy');
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
  assert.equal(routePath({ mod: 'challenges' }), '/retos');
  assert.deepEqual(parseRoute('/en/retos'), { mod: 'challenges' });
  assert.deepEqual(parseRoute('/progreso/'), { mod: 'progress' });
  assert.equal(routePath({ mod: 'about' }), '/acerca');
  assert.deepEqual(parseRoute('/acerca/'), { mod: 'about' });
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

test('routes: the trainers live under /academia, next to the methods', () => {
  assert.equal(routePath({ mod: 'academy', page: { kind: 'trainer', id: 'reconocer-pll' } }), '/academia/reconocer-pll');
  assert.equal(routePath({ mod: 'academy', page: { kind: 'trainer', id: 'auf' } }), '/academia/auf');
  assert.deepEqual(parseRoute('/academia/auf/'), { mod: 'academy', page: { kind: 'trainer', id: 'auf' } });
  assert.deepEqual(parseRoute('/academia/roux'), { mod: 'academy', page: { kind: 'method', id: 'roux' } });
});

test('routes: a language prefix is just the language', () => {
  assert.deepEqual(parseRoute('/en/'), { mod: 'solve' });
  assert.deepEqual(parseRoute('/en'), { mod: 'solve' });
  assert.deepEqual(parseRoute('/pt/academia/cruz/'), { mod: 'academy', page: { kind: 'cross' } });
  assert.deepEqual(parseRoute('/en/cubo/pintar'), { mod: 'cube', page: 'paint' });
  assert.deepEqual(parseRoute('/english'), { mod: 'solve' }); // not a prefix: unknown, the Resolver
});

test('links: Spanish paths get the current language\'s prefix; the rest stay', () => {
  assert.equal(localHref('/academia/cruz', 'es'), '/academia/cruz');
  assert.equal(localHref('/academia/cruz', 'en'), '/en/academia/cruz');
  assert.equal(localHref('/', 'en'), '/en/');
  assert.equal(localHref('/academia/principiante#academy-prin-capa1', 'pt'), '/pt/academia/principiante#academy-prin-capa1');
  assert.equal(localHref('/hoy?x=1', 'en'), '/en/hoy?x=1');
  assert.equal(localHref('/en/academia', 'en'), '/en/academia'); // already in a language: idempotent
  assert.equal(localHref('/academia', 'pt'), '/pt/academia');
  for (const href of ['#academy-x', 'https://speedcubedb.com/a/3x3/OLL27', '//cdn.example.com/x', 'blob:https://twistlab.app/1', '']) assert.equal(localHref(href, 'en'), href);
});

test('sheets: Back closes the open sheet and stays on the page; X leaves no history entry behind', async () => {
  // a browser's history, its traversals a task later (as the real ones), and dialogs whose 'close' is queued
  const entries: unknown[] = [null]; // a deep link: the only entry
  let at = 0;
  const pop: (() => void)[] = [];
  const later = (f: () => void) => setTimeout(f);
  const traverse = (by: number) => later(() => { if (entries[at + by] !== undefined) { at += by; pop.forEach((f) => f()); } });
  Object.assign(globalThis, {
    history: {
      get state() { return entries[at]; },
      get length() { return entries.length; },
      pushState(s: unknown) { entries.splice(++at, Infinity, s); },
      replaceState(s: unknown) { entries[at] = s; },
      back: () => traverse(-1),
      forward: () => traverse(1),
    },
    location: { pathname: '/academia/cfop-completo/caso/cfopc-oll-27', search: '', hash: '' },
    addEventListener: (type: string, f: () => void) => type === 'popstate' && pop.push(f),
    document: { addEventListener() {} },
  });
  class Dialog extends EventTarget {
    open = false;
    showModal() { this.open = true; }
    close() { if (this.open) { this.open = false; later(() => this.dispatchEvent(new Event('close'))); } }
  }
  const settle = () => new Promise((r) => setTimeout(r, 20));
  const sheet = () => new Dialog() as unknown as HTMLDialogElement;
  let routes = 0;
  startRouter(() => routes++);
  const practice = sheet(), quiz = sheet(), trainer = sheet(), viewer = sheet();

  openSheet(practice);
  assert.equal(history.length, 2);
  history.back(); // the phone's Back
  await settle();
  assert.equal(practice.open, false);
  assert.equal(at, 0);
  assert.equal(routes, 1); // the case page stays: only the first apply

  openSheet(practice); // X or Esc: its entry goes too
  practice.close();
  await settle();
  assert.equal(at, 0);

  openSheet(practice); // Practicar hands over to the Quiz (and the Quiz back): one entry all along
  practice.close();
  await Promise.resolve();
  openSheet(quiz);
  await settle();
  assert.deepEqual([quiz.open, at], [true, 1]);
  quiz.close();
  openSheet(practice);
  await settle();
  assert.deepEqual([practice.open, at], [true, 1]);
  history.back();
  await settle();
  assert.deepEqual([practice.open, at], [false, 0]);

  openSheet(trainer); // the 3D viewer over the trainer: Back closes the viewer first
  openSheet(viewer);
  assert.equal(at, 2);
  history.back();
  await settle();
  assert.deepEqual([trainer.open, viewer.open, at], [true, false, 1]);
  history.back();
  await settle();
  assert.deepEqual([trainer.open, at], [false, 0]);

  history.forward(); // Forward to a closed sheet's entry: skipped
  await settle();
  assert.equal(at, 0);
  assert.equal(routes, 1);

  entries[at] = { from: '/academia/cfop-completo' }; // the case page was opened from its method's
  openSheet(practice);
  navigate('/academia/cfop-completo'); // a link in the sheet to that page: followed, not taken for Back
  assert.deepEqual(history.state, { from: '/academia/cfop-completo/caso/cfopc-oll-27' });
});

test('navigate: `replace` takes the entry and keeps where it came from (a lesson\'s Siguiente: one Back to the guide)', () => {
  history.replaceState({ from: '/academia/cruz', step: 9 }, ''); // the sheets test's fake history, at a finished lesson
  const n = history.length;
  navigate('/academia/cruz/leccion/dos', true);
  assert.deepEqual([history.state, history.length], [{ from: '/academia/cruz' }, n]);
});

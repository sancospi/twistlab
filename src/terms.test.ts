import test from 'node:test';
import assert from 'node:assert/strict';
import { TERMS, termSplitter, type TermPiece } from './terms.ts';
import { es } from './i18n/es.ts';
import { en } from './i18n/en.ts';

const terms = (pieces: TermPiece[]) => pieces.filter((p) => p.term).map((p) => `${p.text}=${p.term}`);

test('every occurrence, whole words, any case, both plural and singular', () => {
  const split = termSplitter('es');
  const s = 'Faros a la izquierda; el faro de atrás. Sin FAROS, mira la cruz y las cruces.';
  const pieces = split(s);
  assert.equal(pieces.map((p) => p.text).join(''), s); // nothing lost
  assert.deepEqual(terms(pieces), ['Faros=headlights', 'faro=headlights', 'FAROS=headlights', 'cruz=cross', 'cruces=cross']);
});

test('not inside other words', () => {
  const split = termSplitter('es');
  assert.deepEqual(terms(split('Para parar, compara: capataz, escapa, centroamérica, Antisune.')), ['Antisune=antisune']);
  assert.deepEqual(terms(termSplitter('en')('Edgeless cornered layered slotting pairing; the crossover.')), []);
});

test('accents: with or without, and as a separate mark', () => {
  const split = termSplitter('es');
  assert.deepEqual(terms(split('Inspección, inspeccion e INSPECCIÓN')), ['Inspección=inspection', 'inspeccion=inspection', 'INSPECCIÓN=inspection']);
  assert.deepEqual(terms(split('inspección')), ['inspección=inspection']);
});

test('both languages; multi-word terms, acronyms next to digits and punctuation', () => {
  assert.deepEqual(terms(termSplitter('en')('Insert the pair into the slot (F2L), then OLL/PLL with AUF; Plan B: 8 HTM.')),
    ['pair=pair', 'slot=slot', 'F2L=f2l', 'OLL=oll', 'PLL=pll', 'AUF=auf', 'Plan B=planB', 'HTM=htm']);
  assert.deepEqual(terms(termSplitter('es')('Arma la cruz con 4 aristas; la esquina-arista es un par.')),
    ['cruz=cross', 'aristas=edge', 'esquina=corner', 'arista=edge', 'par=pair']);
  assert.deepEqual(termSplitter('es')(''), []);
});

test('every term has a name and a definition in both languages', () => {
  for (const { key } of TERMS) for (const dict of [es, en] as Record<string, string>[]) {
    assert.ok(dict[`glossary.term.${key}`] && dict[`glossary.def.${key}`], key);
  }
});

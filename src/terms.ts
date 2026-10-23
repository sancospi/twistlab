// Cube terms (faros, AUF, arista…): the Notación glossary's entries, in its order (definitions: glossary.term.* /
// glossary.def.* in i18n), and the words that name them in each language. Pure: rich-text-view.ts marks every
// occurrence in texts as a tappable term with its definition.
import type { Lang } from './i18n.ts';

export interface Term {
  key: string;
  example?: string; // shown in the glossary
  forms: { es: string[]; en: string[]; pt?: string[] }; // words that name it in texts (none: listed in the glossary, never marked); no pt yet: the Spanish
}

const same = (...forms: string[]) => ({ es: forms, en: forms });

export const TERMS: Term[] = [
  { key: 'auf', example: "U U' U2", forms: same('AUF') },
  { key: 'trigger', example: "R U R' U'", forms: { es: ['gatillo', 'gatillos'], en: ['trigger', 'triggers'] } },
  { key: 'setup', forms: { es: [], en: [] } }, // ponytail: "mezcla"/"setup" are everyday words in every text: not marked
  { key: 'planB', forms: same('Plan B') },
  { key: 'htm', forms: same('HTM') },
  { key: 'cross', forms: { es: ['cruz', 'cruces'], en: ['cross', 'crosses'] } },
  { key: 'slot', forms: { es: ['ranura', 'ranuras'], en: ['slot', 'slots'] } },
  { key: 'pair', forms: { es: ['par', 'pares'], en: ['pair', 'pairs'] } },
  { key: 'f2l', forms: same('F2L') },
  { key: 'oll', forms: same('OLL') },
  { key: 'ocll', forms: same('OCLL') },
  { key: 'sune', example: "R U R' U R U2 R'", forms: same('Sune') },
  { key: 'antisune', example: "R U2 R' U' R U' R'", forms: same('Antisune') },
  { key: 'pll', forms: same('PLL') },
  { key: 'headlights', forms: { es: ['faros', 'faro'], en: ['headlights', 'headlight'] } },
  { key: 'block', forms: { es: [], en: [] } }, // ponytail: also a study-plan block and a group of moves in many texts: not marked
  { key: 'inspection', forms: { es: ['inspección'], en: ['inspection'] } },
  { key: 'layer', forms: { es: ['capa', 'capas'], en: ['layer', 'layers'] } },
  { key: 'center', forms: { es: ['centro', 'centros'], en: ['center', 'centers'] } },
  { key: 'edge', forms: { es: ['arista', 'aristas'], en: ['edge', 'edges'] } },
  { key: 'corner', forms: { es: ['esquina', 'esquinas'], en: ['corner', 'corners'] } },
];

export type TermPiece = { text: string; term?: string }; // term: the glossary key

/** Lower case, without accents: "Inspección" and "inspeccion" are the same word. */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const VOWELS: Record<string, string> = { a: '[aá]', e: '[eé]', i: '[ií]', o: '[oó]', u: '[uúü]' };

/** Splits a text into plain runs and terms: every occurrence, whole words only, any case, with or without accents. */
export function termSplitter(lang: Lang, terms: Term[] = TERMS): (s: string) => TermPiece[] {
  const keys = new Map(terms.flatMap((t) => (t.forms[lang] ?? t.forms.es).map((f) => [fold(f), t.key] as const)));
  if (!keys.size) return (s) => (s ? [{ text: s }] : []);
  const alts = [...keys.keys()].sort((a, b) => b.length - a.length)
    .map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[aeiou]/g, (v) => VOWELS[v]));
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  return (raw) => {
    const s = raw.normalize('NFC'); // an accent as a separate mark would split the word
    const out: TermPiece[] = [];
    let at = 0;
    for (const m of s.matchAll(re)) {
      if (m.index > at) out.push({ text: s.slice(at, m.index) });
      out.push({ text: m[0], term: keys.get(fold(m[0])) });
      at = m.index + m[0].length;
    }
    if (at < s.length) out.push({ text: s.slice(at) });
    return out;
  };
}

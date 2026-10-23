// i18n: every user-facing string goes through t() (UI) or loc() (content). Spanish is built in; English (i18n/en.ts)
// and Portuguese (i18n/pt.ts, pt-BR) are lazy chunks that boot.ts loads before anything renders, for their visitors only.
// The URL decides the language: Spanish at the root (/academia), the others under their prefix (/en/academia, /pt/…).
import { es, type MessageKey } from './i18n/es.ts';

export type Lang = 'es' | 'en' | 'pt';
export type { MessageKey };

/** Portuguese goes public: the ES · EN · PT switch, /pt/ pages prerendered, in the sitemap and in hreflang. Until then
 *  /pt/… works (missing texts fall back to Spanish) but nothing links to it or lists it, so no Spanish duplicates get
 *  indexed. TRANSLATOR, to ship Portuguese:
 *  1. src/i18n/pt.ts: every key of es.ts (i18n.test.ts lists the missing ones, and turns strict once this is true).
 *  2. Content: a `pt` next to each `en` in Localized texts, i.e. the tr(es, en) helpers of src/academy/*.ts (give them a
 *     third argument) and the `{ es, en }` literals; the maps keyed by Spanish (cfop.pt.ts, beginner2x2.pt.ts, beside
 *     their *.en.ts); terms.ts's `pt` forms. Missing ones show the Spanish.
 *  3. Set this to true, then npm test and npm run build (it prerenders /pt/…). */
export const PT_READY = false;
/** The languages with public URLs, Spanish first (x-default). */
export const LANGS: readonly Lang[] = PT_READY ? ['es', 'en', 'pt'] : ['es', 'en'];

/** Content that ships translated with the data (case names, recognition hints…); Spanish is the fallback. */
export type Localized = { es: string; en?: string; pt?: string };

/** Spanish text with its other languages from maps keyed by the Spanish (cfop.en.ts…), line by line; a language with a
 *  line missing is left out (it shows the Spanish). */
export function fromSpanish(text: string, maps: Partial<Record<Exclude<Lang, 'es'>, Record<string, string>>>): Localized {
  const out: Localized = { es: text };
  for (const [l, map] of Object.entries(maps) as [Exclude<Lang, 'es'>, Record<string, string>][]) {
    const lines = text.split('\n').map((line) => map[line]);
    if (!lines.includes(undefined as never)) out[l] = lines.join('\n');
  }
  return out;
}

/** A path's language and its path without the prefix: /en/academia → en, /academia; /academia → es. */
export function splitLang(pathname: string): { lang: Lang; path: string } {
  const m = /^\/(en|pt)(\/.*)?$/.exec(pathname);
  return m ? { lang: m[1] as Lang, path: m[2] || '/' } : { lang: 'es', path: pathname };
}
/** The inverse: a (Spanish) path in a language. The other languages' home is /en/. */
export const langPath = (path: string, l: Lang): string => (l === 'es' ? path : `/${l}${path}`);

/** localStorage key of the chosen language (outside progress.ts's backup prefixes: not data, not a returning visitor). */
export const LANG_KEY = 'lang';

// index.html's inline script picks the language before the first paint (the URL's) and sets <html lang>: read here,
// so the rule lives in one place. Node: Spanish, or TWISTLAB_LANG (the build prerenders each language in its own worker,
// so data that reads the language when it loads gets it right).
const nodeLang = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.TWISTLAB_LANG;
const docLang = typeof document !== 'undefined' ? document.documentElement.lang : nodeLang;
export const lang: Lang = docLang === 'en' || docLang === 'pt' ? docLang : 'es';

let dict: Partial<Record<MessageKey, string>> = es;

/** Loads the current language's dictionary (boot.ts awaits it before the app). Offline without it: Spanish UI. */
export async function loadLang(): Promise<void> {
  if (lang === 'en') dict = await import('./i18n/en.ts').then((m) => m.en, () => es);
  if (lang === 'pt') dict = await import('./i18n/pt.ts').then((m) => m.pt, () => es);
}

/** Remembers the language and opens this page in it (the URL decides the language; the choice decides where a visit
 *  that starts at a Spanish URL goes: index.html's inline script). */
export function setLang(l: Lang): void {
  try { localStorage.setItem(LANG_KEY, l); } catch { /* no storage: the URL still switches */ }
  location.assign(langPath(splitLang(location.pathname).path, l) + location.search + location.hash);
}

/** UI string; `{name}` placeholders are filled from params. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const s = dict[key] ?? es[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : s;
}

/** Plural-aware: picks `${key}.one` / `${key}.other` with Intl.PluralRules; `{n}` is the count. */
export function tp(key: string, n: number, params?: Record<string, string | number>): string {
  const form = new Intl.PluralRules(lang).select(n) === 'one' ? 'one' : 'other';
  return t(`${key}.${form}` as MessageKey, { n, ...params });
}

export const loc = (text: Localized): string => text[lang] ?? text.es;

/** Fills static markup: data-i18n (text), data-i18n-title, data-i18n-aria-label, data-i18n-placeholder. */
export function applyI18n(root: ParentNode = document): void {
  for (const [attr, set] of [
    ['data-i18n', (el: Element, s: string) => (el.textContent = s)],
    ['data-i18n-title', (el: Element, s: string) => el.setAttribute('title', s)],
    ['data-i18n-aria-label', (el: Element, s: string) => el.setAttribute('aria-label', s)],
    ['data-i18n-placeholder', (el: Element, s: string) => el.setAttribute('placeholder', s)],
  ] as const) {
    root.querySelectorAll(`[${attr}]`).forEach((el) => set(el, t(el.getAttribute(attr) as MessageKey)));
  }
  root.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)));
  if (root === document) {
    document.documentElement.lang = lang;
    document.documentElement.classList.remove('i18n-wait'); // the inline script hid an English page until now
  }
}

/** The build's markup in a dictionary: data-i18n texts (elements without children) and the data-i18n-title/aria-label
 *  attributes, written in next to their key. Idempotent: the prerender runs it again on the Spanish build per language. */
export const fillI18n = (html: string, text: (key: string) => string): string => html
  .replace(/(<(\w+)\s[^>]*\bdata-i18n="([\w.]+)"[^>]*>)[^<]*(<\/\2>)/g, (_, open, _tag, key, close) => open + text(key) + close)
  .replace(/\sdata-i18n-(title|aria-label)="([\w.]+)"(?: \1="[^"]*")?/g, (_, attr, key) => ` data-i18n-${attr}="${key}" ${attr}="${text(key)}"`);

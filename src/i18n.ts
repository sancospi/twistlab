// i18n: every user-facing string goes through t() (UI) or loc() (content). Each language's dictionary (i18n/es.ts, en.ts,
// pt.ts for pt-BR) is a lazy chunk that boot.ts loads before anything renders, so a visitor downloads only theirs
// (index.html's inline script preloads it). The URL decides the language: Spanish at the root (/academia), the others
// under their prefix (/en/academia, /pt/…).
import type { MessageKey } from './i18n/es.ts';

export type Lang = 'es' | 'en' | 'pt';
export type { MessageKey };

/** The languages with public URLs, Spanish first (x-default). */
export const LANGS: readonly Lang[] = ['es', 'en', 'pt'];

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

let dict: Partial<Record<MessageKey, string>> = {};
const DICTS: Record<Lang, () => Promise<Record<MessageKey, string>>> = {
  es: () => import('./i18n/es.ts').then((m) => m.es),
  en: () => import('./i18n/en.ts').then((m) => m.en),
  pt: () => import('./i18n/pt.ts').then((m) => m.pt),
};

/** Loads the current language's dictionary (boot.ts awaits it before the app). If its chunk can't load (offline
 *  before the worker cached it): Spanish, else the keys themselves. */
export async function loadLang(): Promise<void> {
  dict = await DICTS[lang]().catch(() => DICTS.es()).catch(() => ({}));
}
// node (tests, the build): loaded right away, so t() works as soon as this module is imported
if (typeof document === 'undefined') await loadLang();

/** Remembers the language and opens this page in it (the URL decides the language; the choice decides where a visit
 *  that starts at a Spanish URL goes: index.html's inline script). */
export function setLang(l: Lang): void {
  try { localStorage.setItem(LANG_KEY, l); } catch { /* no storage: the URL still switches */ }
  location.assign(langPath(splitLang(location.pathname).path, l) + location.search + location.hash);
}

/** UI string; `{name}` placeholders are filled from params. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const s = dict[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : s;
}

/** A key with both plural forms: 'daily.streak' for 'daily.streak.one' + '.other', so renaming or dropping either one
 *  fails tp()'s callers instead of showing the raw key. */
type PluralStem<K> = K extends `${infer P}.one` ? (`${P}.other` extends MessageKey ? P : never) : never; // generic: runs per key
type PluralKey = PluralStem<MessageKey>;

/** Plural-aware: picks `${key}.one` / `${key}.other` with Intl.PluralRules; `{n}` is the count. */
export function tp(key: PluralKey, n: number, params?: Record<string, string | number>): string {
  const form = new Intl.PluralRules(lang).select(n) === 'one' ? 'one' : 'other';
  return t(`${key}.${form}` as MessageKey, { n, ...params });
}

/** A glossary text by its id ('see', 'term.<id>', 'def.<id>', a move group…): the ids come from data (terms.ts,
 *  MOVE_GROUPS), so this is the one place their key goes unchecked. */
export const glossary = (k: string): string => t(`glossary.${k}` as MessageKey);

export const loc = (text: Localized): string => text[lang] ?? text.es;

/** A page's document title, "Cronómetro · TwistLab", as the app sets it and seo.ts prerenders it (the same, so nothing
 *  changes when the app boots). */
export const pageTitle = (page: string) => t('app.pageTitle', { page, app: t('app.title') });
/** An Academia page's name, "CFOP reducido · Academia" (its title: pageTitle of it). */
export const inAcademy = (page: string) => t('app.pageTitle', { page, app: t('menu.academy') });

// Content written in its three languages side by side (src/academy/*.ts); content.i18n.test.ts checks none is missing.
export const tr = (es: string, en: string, pt: string): Localized => ({ es, en, pt });
/** Rich text in every language: same structure (lines), joined once. */
export const doc = (es: string[], en: string[], pt: string[]): Localized => tr(es.join('\n'), en.join('\n'), pt.join('\n'));
/** A case code is a plain string shown as is: the visitor's language, picked when the data loads. */
export const word = (es: string, en: string, pt: string): string => loc(tr(es, en, pt));
/** A share (0–1) as a percent in the visitor's language: 0.85 → "85 %" / "85%". */
export const percent = (x: number): string => new Intl.NumberFormat(lang, { style: 'percent' }).format(x);

/** Fills static markup: data-i18n (text), data-i18n-title, data-i18n-aria-label, data-i18n-placeholder. */
export function applyI18n(root: ParentNode = document): void {
  for (const [attr, set] of [
    ['data-i18n', (el: Element, s: string) => (el.textContent = s)],
    ['data-i18n-title', (el: Element, s: string) => el.setAttribute('title', s)],
    ['data-i18n-aria-label', (el: Element, s: string) => el.setAttribute('aria-label', s)],
    ['data-i18n-placeholder', (el: Element, s: string) => el.setAttribute('placeholder', s)],
  ] as const) {
    root.querySelectorAll(`[${attr}]`).forEach((el) => {
      const key = el.getAttribute(attr) as MessageKey, s = t(key);
      if (s !== key) set(el, s); // no dictionary (its chunk didn't load): the build's Spanish stays
    });
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

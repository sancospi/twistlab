// i18n: every user-facing string goes through t() (UI) or loc() (content). Spanish is built in; English (i18n/en.ts)
// is a lazy chunk that boot.ts loads before anything renders, for English visitors only.
import { es, type MessageKey } from './i18n/es.ts';

export type Lang = 'es' | 'en';
export type { MessageKey };

/** Content that ships translated with the data (case names, recognition hints…); Spanish is the fallback. */
export type Localized = { es: string; en?: string };

/** localStorage key of the chosen language (outside progress.ts's backup prefixes: not data, not a returning visitor). */
export const LANG_KEY = 'lang';

// index.html's inline script picks the language before the first paint (the remembered one, else the browser's: en* →
// English) and sets <html lang>: read here, so the rule lives in one place. Node (tests, the build) stays Spanish.
export const lang: Lang = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es';

let dict: Record<MessageKey, string> = es;

/** Loads the current language's dictionary (boot.ts awaits it before the app). Offline without it: Spanish UI. */
export async function loadLang(): Promise<void> {
  if (lang === 'en') dict = await import('./i18n/en.ts').then((m) => m.en, () => es);
}

/** Remembers the language and reloads: every page and text is rebuilt in it. */
export function setLang(l: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    return; // ponytail: no storage, no choice to remember: the browser's language stays
  }
  location.reload();
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

// i18n: every user-facing string goes through t() (UI) or loc() (content). Only Spanish for now;
// adding a language = adding a dictionary that satisfies Record<MessageKey, string> and a Localized key.
import { es, type MessageKey } from './i18n/es.ts';

export type Lang = 'es';
export type { MessageKey };

/** Content that ships translated with the data (case names, recognition hints…). */
export type Localized = Record<Lang, string>;

const DICTS: Record<Lang, Record<MessageKey, string>> = { es };
export const lang: Lang = 'es';

/** UI string; `{name}` placeholders are filled from params. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const s = DICTS[lang][key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : s;
}

/** Plural-aware: picks `${key}.one` / `${key}.other` with Intl.PluralRules; `{n}` is the count. */
export function tp(key: string, n: number, params?: Record<string, string | number>): string {
  const form = new Intl.PluralRules(lang).select(n) === 'one' ? 'one' : 'other';
  return t(`${key}.${form}` as MessageKey, { n, ...params });
}

export const loc = (text: Localized): string => text[lang];

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
  if (root === document) document.documentElement.lang = lang;
}

// The DOM by hand: building elements (el) and finding index.html's (one copy instead of one per view; index-html.test.ts
// checks that every id the code looks up is in index.html).

/** index.html's element with this id (its type when given, e.g. $<HTMLDialogElement>('quiz')). */
export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
export const btn = (id: string) => $<HTMLButtonElement>(id);

/** Element with properties and children: enough DOM building for the app's views. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e: HTMLElementTagNameMap[K] = document.createElement(tag);
  Object.assign(e, props);
  e.append(...children);
  return e;
}

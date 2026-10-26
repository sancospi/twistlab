// Guide text (see rich-text.ts) as DOM: paragraphs, lists and subheadings; `moves` become tappable notation and cube
// terms (terms.ts) tappable definitions, except in subheadings: in a block of text, only a term's first appearance
// (each one a Tab stop and an underline: "cruz" 16 times on its own page was noise).
import { algView } from './notation-view.ts';
import { tokenize } from './notation.ts';
import { parseBlocks, parseInline, type Inline } from './rich-text.ts';
import { termSplitter } from './terms.ts';
import { hideTip, showTip } from './tooltip.ts';
import { glossary, lang } from './i18n.ts';
import { routePath } from './router.ts';

const isNotation = (s: string) => {
  try {
    return tokenize(s).length > 0;
  } catch {
    return false;
  }
};

const splitTerms = termSplitter(lang);

/** A term as a button: its name and short definition in the shared tooltip, with a link to the glossary. */
function termButton(word: string, key: string): HTMLElement {
  const b = Object.assign(document.createElement('button'), { type: 'button', className: 'term', textContent: word });
  b.setAttribute('aria-expanded', 'false');
  b.onclick = (e) => {
    e.stopPropagation(); // inside a clickable row, as moves
    const box = Object.assign(document.createElement('div'), { className: 'tip-text tip-term' });
    const link = Object.assign(document.createElement('a'), { href: routePath({ mod: 'academy', page: { kind: 'notation' } }), textContent: glossary('see'), onclick: hideTip });
    box.append(Object.assign(document.createElement('strong'), { textContent: glossary(`term.${key}`) }),
      Object.assign(document.createElement('span'), { textContent: glossary(`def.${key}`) }), link);
    if (showTip(b, [box]) && e.detail === 0) link.focus(); // keyboard: the tip sits at the end of the body, Tab would never reach the link
  };
  return b;
}

/** Plain text with its cube terms tappable (`seen`: the terms already marked in this block, left plain; marks each one
 *  it marks). A term is a button, and a line may break after one: the punctuation right after it ("arista:") goes in
 *  one unbreakable span with it, so it never starts a line alone. */
export function termNodes(s: string, seen = new Set<string>()): Node[] {
  const out: Node[] = [];
  const pieces = splitTerms(s);
  pieces.forEach((p, i) => {
    if (!p.term || seen.has(p.term)) return void (p.text && out.push(document.createTextNode(p.text)));
    seen.add(p.term);
    const next = pieces[i + 1];
    const glued = next && !next.term ? /^[.,:;!?)»”…]+/.exec(next.text)?.[0] : undefined;
    if (!glued) return void out.push(termButton(p.text, p.term));
    next.text = next.text.slice(glued.length);
    const span = Object.assign(document.createElement('span'), { className: 'term-glue' });
    span.append(termButton(p.text, p.term), glued);
    out.push(span);
  });
  return out;
}

/** `seen`: as termNodes' (false: no terms, as in a subheading). */
function inlineNodes(inline: Inline[], seen: Set<string> | false): Node[] {
  const words = (s: string) => (seen ? termNodes(s, seen) : [document.createTextNode(s)]);
  return inline.flatMap((part) => {
    if (part.kind === 'strong') {
      const strong = document.createElement('strong');
      strong.append(...words(part.text));
      return [strong];
    }
    if (part.kind === 'alg') {
      if (!isNotation(part.text)) return [Object.assign(document.createElement('code'), { textContent: part.text })];
      return [algView(part.text)];
    }
    return words(part.text);
  });
}

/** One line of data text (recognition, notes…) inline: **bold**, `moves` and cube terms, no blocks. */
export const inlineText = (s: string): Node[] => inlineNodes(parseInline(s.replace(/\s*\n\s*/g, ' ')), new Set());

/** The formatted text as DOM nodes. */
export function richText(s: string, heading: 'h3' | 'h4' = 'h4'): Node[] {
  const seen = new Set<string>(); // each term tappable once in the whole text
  return parseBlocks(s).map((b) => {
    if ('items' in b) {
      const list = document.createElement(b.kind);
      for (const item of b.items) {
        const li = document.createElement('li');
        li.append(...inlineNodes(item, seen));
        list.append(li);
      }
      return list;
    }
    const el = document.createElement(b.kind === 'h' ? heading : 'p');
    el.append(...inlineNodes(b.inline, b.kind !== 'h' && seen));
    return el;
  });
}

/** A block of guide text: a <div> with the formatted content (class for spacing/width). */
/** `heading`: the level of its '## ' subheadings (h3 right under a page section's h2). */
export function prose(s: string, className = 'prose', heading: 'h3' | 'h4' = 'h4'): HTMLElement {
  const div = document.createElement('div');
  div.className = className;
  div.append(...richText(s, heading));
  return div;
}

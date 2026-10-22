// Guide text (see rich-text.ts) as DOM: paragraphs, lists and subheadings; `moves` become tappable notation and cube
// terms (terms.ts) tappable definitions, except in subheadings.
import { algView } from './notation-view.ts';
import { tokenize } from './notation.ts';
import { parseBlocks, parseInline, type Inline } from './rich-text.ts';
import { termSplitter } from './terms.ts';
import { hideTip, showTip } from './tooltip.ts';
import { lang, t, type MessageKey } from './i18n.ts';
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
    const g = (k: string) => t(`glossary.${k}` as MessageKey);
    const box = Object.assign(document.createElement('div'), { className: 'tip-text tip-term' });
    const link = Object.assign(document.createElement('a'), { href: routePath({ mod: 'academy', page: { kind: 'notation' } }), textContent: g('see'), onclick: hideTip });
    box.append(Object.assign(document.createElement('strong'), { textContent: g(`term.${key}`) }),
      Object.assign(document.createElement('span'), { textContent: g(`def.${key}`) }), link);
    if (showTip(b, [box]) && e.detail === 0) link.focus(); // keyboard: the tip sits at the end of the body, Tab would never reach the link
  };
  return b;
}

/** Plain text with every cube term tappable. */
export const termNodes = (s: string): Node[] =>
  splitTerms(s).map((p) => (p.term ? termButton(p.text, p.term) : document.createTextNode(p.text)));

function inlineNodes(inline: Inline[], terms = true): Node[] {
  const words = (s: string) => (terms ? termNodes(s) : [document.createTextNode(s)]);
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
export const inlineText = (s: string): Node[] => inlineNodes(parseInline(s.replace(/\s*\n\s*/g, ' ')));

/** The formatted text as DOM nodes. */
export function richText(s: string, heading: 'h3' | 'h4' = 'h4'): Node[] {
  return parseBlocks(s).map((b) => {
    if ('items' in b) {
      const list = document.createElement(b.kind);
      for (const item of b.items) {
        const li = document.createElement('li');
        li.append(...inlineNodes(item));
        list.append(li);
      }
      return list;
    }
    const el = document.createElement(b.kind === 'h' ? heading : 'p');
    el.append(...inlineNodes(b.inline, b.kind !== 'h'));
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

// Guide text (see rich-text.ts) as DOM: paragraphs, lists and subheadings; `moves` become tappable notation.
import { algView } from './notation-view.ts';
import { tokenize } from './notation.ts';
import { parseBlocks, type Inline } from './rich-text.ts';

const isNotation = (s: string) => {
  try {
    return tokenize(s).length > 0;
  } catch {
    return false;
  }
};

function inlineNodes(inline: Inline[]): Node[] {
  return inline.map((part) => {
    if (part.kind === 'strong') return Object.assign(document.createElement('strong'), { textContent: part.text });
    if (part.kind === 'alg') {
      if (!isNotation(part.text)) return Object.assign(document.createElement('code'), { textContent: part.text });
      return algView(part.text);
    }
    return document.createTextNode(part.text);
  });
}

/** The formatted text as DOM nodes. */
export function richText(s: string): Node[] {
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
    const el = document.createElement(b.kind === 'h' ? 'h4' : 'p');
    el.append(...inlineNodes(b.inline));
    return el;
  });
}

/** A block of guide text: a <div> with the formatted content (class for spacing/width). */
export function prose(s: string, className = 'prose'): HTMLElement {
  const div = document.createElement('div');
  div.className = className;
  div.append(...richText(s));
  return div;
}

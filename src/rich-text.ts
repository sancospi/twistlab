// Light formatting for guide texts (content data): one line = one paragraph; "- " lines make a list, "1. " lines a
// numbered list, "## " a subheading; inline **bold** and `moves` (rendered as tappable notation). This is the pure
// parser; rich-text-view.ts builds DOM nodes from it (never innerHTML, so content can't inject markup).

export type Inline = { kind: 'text'; text: string } | { kind: 'strong'; text: string } | { kind: 'alg'; text: string };
export type Block =
  | { kind: 'p'; inline: Inline[] }
  | { kind: 'h'; inline: Inline[] }
  | { kind: 'ul' | 'ol'; items: Inline[][] };

export function parseInline(s: string): Inline[] {
  // bold hugs its text ("** **" isn't bold), as in Markdown
  return s.split(/(\*\*(?=\S)[^*]*?\S\*\*|`[^`]+`)/).filter(Boolean).map((part): Inline => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return { kind: 'strong', text: part.slice(2, -2) };
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return { kind: 'alg', text: part.slice(1, -1) };
    return { kind: 'text', text: part };
  });
}

export function parseBlocks(s: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of s.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = /^[-•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^##\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      const item = parseInline((bullet ?? numbered)![1]);
      const last = blocks.at(-1);
      if (last && last.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else if (heading) {
      blocks.push({ kind: 'h', inline: parseInline(heading[1]) });
    } else {
      blocks.push({ kind: 'p', inline: parseInline(line) });
    }
  }
  return blocks;
}

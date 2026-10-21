import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBlocks, parseInline } from './rich-text.ts';

test('inline: bold and moves, the rest is text', () => {
  assert.deepEqual(parseInline("Haz **F2** o `R U R'` y listo"), [
    { kind: 'text', text: 'Haz ' }, { kind: 'strong', text: 'F2' }, { kind: 'text', text: ' o ' },
    { kind: 'alg', text: "R U R'" }, { kind: 'text', text: ' y listo' },
  ]);
  assert.deepEqual(parseInline('sin formato'), [{ kind: 'text', text: 'sin formato' }]);
  assert.deepEqual(parseInline('** ** y ``'), [{ kind: 'text', text: '** ** y ``' }]); // empty markers stay text
});

test('blocks: one line per paragraph, consecutive list lines group, subheadings', () => {
  const blocks = parseBlocks('Uno.\n\n- a\n- **b**\n1. x\n2) y\n## Título\nDos.');
  assert.deepEqual(blocks.map((b) => b.kind), ['p', 'ul', 'ol', 'h', 'p']);
  assert.equal((blocks[1] as { items: unknown[] }).items.length, 2);
  assert.equal((blocks[2] as { items: unknown[] }).items.length, 2);
  assert.deepEqual(parseBlocks('Línea uno\nLínea dos').map((b) => b.kind), ['p', 'p']); // today's content keeps its paragraphs
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METHODS } from './methods.ts';
import { howToSolve } from './howToSolve.ts';
import { triggerGuide } from './triggers.ts';
import { crossGuide } from './crossGuide.ts';
import { bases2x2 } from './bases2x2.ts';

// Portuguese is public (i18n.ts PT_READY): every Localized text that has English has Portuguese too (a missing one
// would show the Spanish; for cfop.ts and beginner2x2.ts, a line missing from their *.pt.ts maps).
test('every Localized text with English has Portuguese', () => {
  const missing: string[] = [];
  const walk = (v: unknown): void => {
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (typeof o.es === 'string') {
      if (typeof o.en === 'string' && typeof o.pt !== 'string') missing.push(o.es);
      return;
    }
    Object.values(o).forEach(walk);
  };
  [METHODS, howToSolve, triggerGuide, crossGuide, bases2x2].forEach(walk);
  assert.deepEqual(missing, []);
});

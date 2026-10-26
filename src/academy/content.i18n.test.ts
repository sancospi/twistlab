import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METHODS } from './methods.ts';
import { howToSolve } from './howToSolve.ts';
import { triggerGuide } from './triggers.ts';
import { crossGuide } from './crossGuide.ts';
import { bases2x2 } from './bases2x2.ts';
import { smartCubes } from './smartCubes.ts';

// Every Localized text of the content ships in the three languages (a missing one shows the Spanish). For cfop.ts and
// beginner2x2.ts: no line missing from their *.en.ts / *.pt.ts maps; for the maps keyed by case number (oll.ts's
// RECOG_EN…): no entry missing, which tsc doesn't catch (a missing key is undefined at runtime).
test('every Localized text has English and Portuguese', () => {
  const missing: string[] = [];
  const walk = (v: unknown): void => {
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (typeof o.es === 'string') {
      if (typeof o.en !== 'string' || typeof o.pt !== 'string') missing.push(o.es);
      return;
    }
    Object.values(o).forEach(walk);
  };
  [METHODS, howToSolve, triggerGuide, crossGuide, bases2x2, smartCubes].forEach(walk);
  assert.deepEqual(missing, []);
});

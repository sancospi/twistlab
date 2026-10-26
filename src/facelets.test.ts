import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { faceletsToPattern, patternToFacelets, SOLVED_FACELETS } from './facelets.ts';

test('facelets <-> KPattern', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  assert.equal(patternToFacelets(solved), SOLVED_FACELETS);
  // R from solved: U's right column shows F stickers
  assert.equal(patternToFacelets(solved.applyAlg('R')).slice(0, 9), 'UUFUUFUUF');
  const scrambled = solved.applyAlg("R U R' U' F2 D L' B U2 R2");
  const back = await faceletsToPattern(patternToFacelets(scrambled));
  assert.ok(back.isIdentical(scrambled));
});

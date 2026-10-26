import test from 'node:test';
import assert from 'node:assert/strict';
import { cube3x3x3 } from 'cubing/puzzles';
import { cfopFull } from './cfopFull.ts';
import { caseState, goalReached, seenAfter } from './cube.ts';
import { inspect } from './inspect.ts';
import { allCases } from './methods.ts';
import { IDENTITY, centerMoves, invertTokens, tokenize } from '../notation.ts';

const kpuzzle = await cube3x3x3.kpuzzle();
const solved = kpuzzle.defaultPattern();
const main = (c: { algs: { alg: string }[] }) => c.algs[0].alg;
const inv = (alg: string) => invertTokens(tokenize(alg)).join(' ');
/** The cube's (cube frame) from a state in the Academia's frame (yellow up): z2 back. */
const onCube = (user: typeof solved) => seenAfter(user, 'z2');
/** The moves as the user plays them, holding yellow up: rotations are whole-cube turns (centers stay put). */
const play = (user: typeof solved, moves: string[]) => user.applyAlg(centerMoves(moves.join(' '), IDENTITY).join(' '));
// the case's pair is the only one out of place: the moves must leave the first two layers whole (a check on the
// front-right pieces alone would pass on a rotated slot, whose pair isn't the one at front-right)
const f2lDone = (q: typeof solved) => goalReached('f2l', q, 'U');

test('inspect: solved, and no white cross yet', () => {
  assert.deepEqual(inspect(solved, main), { kind: 'solved' });
  assert.deepEqual(inspect(solved.applyAlg('R U F D2 L'), main), { kind: 'cross' });
});

test('inspect: every F2L case found in every slot and AUF, and the moves shown solve that pair', () => {
  for (const c of allCases(cfopFull).filter((x) => x.stage === 'f2l')) {
    const S = caseState(kpuzzle, main(c), IDENTITY); // the case at front-right, yellow up
    for (const rot of ['', 'y', 'y2', "y'"]) {
      for (const auf of ['', 'U', "U'", 'U2']) {
        const off = auf ? S.applyAlg(inv(auf)) : S;
        const user = rot ? seenAfter(off, inv(rot)) : off; // the pair in another slot, off by an AUF
        const r = inspect(onCube(user), main);
        assert.ok(r.kind === 'f2l');
        const found = r.pairs.find((x) => x.c === c);
        assert.ok(found, `${c.id} ${rot} ${auf}`);
        assert.ok(f2lDone(play(user, found.moves)), `${c.id} ${rot} ${auf}: ${found.moves.join(' ')}`);
        assert.ok(!/^U.? U/.test(found.moves.filter((m) => m[0] !== 'y').join(' ')), found.moves.join(' ')); // the AUF folded in
      }
    }
  }
});

test('inspect: the moves shown are for the user\'s own algorithm, with the U turn it needs', () => {
  const c = allCases(cfopFull).find((x) => x.stage === 'f2l' && x.algs.length > 1)!;
  const other = (x: typeof c) => (x === c ? x.algs[1].alg : main(x));
  const S = caseState(kpuzzle, main(c), IDENTITY);
  for (const auf of ['', 'U', "U'", 'U2']) {
    const user = auf ? S.applyAlg(inv(auf)) : S;
    const r = inspect(onCube(user), other);
    const found = r.kind === 'f2l' ? r.pairs.find((x) => x.c === c) : undefined;
    assert.ok(found && f2lDone(play(user, found.moves)), `${c.id} ${auf}: ${found?.moves.join(' ')}`);
  }
});

test('inspect: the first two layers done, the OLL or PLL case and how to do it; then the last U turn', () => {
  const sune = solved.applyAlg(inv("R U R' U R U2 R'"));
  const r = inspect(onCube(sune), main);
  assert.ok(r.kind === 'll' && r.c.stage === 'oll-corners');
  const t = solved.applyAlg(inv("R U R' U' R' F R2 U' R' U' R U R' F'"));
  const s = inspect(onCube(t), main);
  assert.ok(s.kind === 'll' && s.c.id === 'cfopc-pll-t');
  assert.ok(play(t, s.moves).experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }));
  assert.deepEqual(inspect(onCube(solved.applyAlg("U'")), main), { kind: 'auf', moves: ['U'] });
});

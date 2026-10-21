import test from 'node:test';
import assert from 'node:assert/strict';
import { YELLOW_UP, expand, htm } from '../notation.ts';
import { StepFollower } from './follow.ts';

const run = (f: StepFollower, moves: string[]) => moves.map((m) => f.feed(m));

test('slices and half turns accept any valid interleaving and direction', () => {
  const { steps } = expand("M2 U M U2 M' U M2", YELLOW_UP);
  const plans = [
    steps.flatMap((s) => s.moves.flatMap((m) => (m.endsWith('2') ? [m[0], m[0]] : [m]))),
    steps.flatMap((s) => [...s.moves].reverse().flatMap((m) => (m.endsWith('2') ? [m[0] + "'", m[0] + "'"] : [m]))),
  ];
  // Interleave the faces of each slice: first quarter of each, then the rest.
  plans.push(steps.flatMap((s) => {
    const q = s.moves.map((m) => (m.endsWith('2') ? [m[0], m[0]] : [m]));
    return [...q.map((x) => x[0]), ...q.flatMap((x) => x.slice(1))];
  }));
  for (const plan of plans) {
    const f = new StepFollower(steps);
    const out = run(f, plan);
    assert.equal(out.at(-1), 'done', plan.join(' '));
    assert.ok(!out.includes('wrong'), plan.join(' '));
    assert.equal(out.filter((r) => r === 'step').length, steps.length - 1);
    assert.ok(f.done);
  }
});

test('a half turn, once started, must finish in the same direction', () => {
  const f = new StepFollower(expand('R2', YELLOW_UP).steps); // L2 on the cube
  assert.deepEqual(f.remaining(), ['L2']);
  assert.equal(f.feed("L'"), 'ok');
  assert.deepEqual(f.remaining(), ["L'"]);
  assert.equal(f.feed('L'), 'wrong');
  assert.deepEqual(f.undo, ["L'"]);
  assert.equal(f.feed("L'"), 'ok'); // undoes the wrong move
  assert.equal(f.feed("L'"), 'done');
});

test('wrong moves stack up and must be undone in order', () => {
  const f = new StepFollower(expand("R U R'", YELLOW_UP).steps); // L D L'
  assert.equal(f.feed('L'), 'step');
  assert.equal(f.feed('F'), 'wrong');
  assert.equal(f.feed('D'), 'wrong'); // right move, but the mess comes first
  assert.deepEqual(f.undo, ["F'", "D'"]);
  assert.equal(f.feed("F'"), 'wrong'); // not the top of the stack
  assert.equal(f.feed('F'), 'ok');
  assert.equal(f.feed("D'"), 'ok');
  assert.equal(f.feed("F'"), 'ok');
  assert.deepEqual(f.undo, []);
  assert.equal(f.index, 1);
  assert.equal(f.feed('D'), 'step');
  assert.equal(f.feed("L'"), 'done');
  assert.equal(f.feed('L'), 'wrong'); // nothing left to do
});

test('a wrong face turned all the way round leaves nothing to undo', () => {
  const f = new StepFollower(expand("R U R'", YELLOW_UP).steps); // L D L'
  assert.equal(f.feed('L'), 'step');
  assert.deepEqual(run(f, ['F', 'F', 'F', 'F']), ['wrong', 'wrong', 'wrong', 'wrong']); // a wrong F2, finished as a full turn
  assert.deepEqual(f.undo, []);
  assert.deepEqual(run(f, ['D', "L'"]), ['step', 'done']);
  const g = new StepFollower(expand("R U R'", YELLOW_UP).steps);
  run(g, ['L', 'B', 'F', 'F', 'F', 'F']); // an older mistake stays pending
  assert.deepEqual(g.undo, ["B'"]);
});

test('a perfect slice algorithm, reported interleaved, scores the reference HTM', () => {
  const { steps } = expand('M2 U M2 U2 M2 U M2', YELLOW_UP); // H-perm
  const f = new StepFollower(steps);
  const done = steps.flatMap((s) => (s.moves.length === 2 && s.moves.every((m) => m.endsWith('2'))
    ? [s.moves[0][0], s.moves[1][0], s.moves[0][0], s.moves[1][0]] // R L R L
    : s.moves.flatMap((m) => (m.endsWith('2') ? [m[0], m[0]] : [m]))));
  assert.equal(run(f, done).at(-1), 'done');
  assert.equal(htm(done), htm(steps.flatMap((s) => s.moves)));
});

test('rotations are skipped, at the start and in a tail', () => {
  const f = new StepFollower(expand("y R U R' y", YELLOW_UP).steps);
  assert.equal(f.index, 1);
  assert.deepEqual(run(f, ['B', 'D', "B'"]), ['step', 'step', 'done']); // after y, user R is the blue center
  assert.ok(f.done);
  const g = new StepFollower(expand("R U R' y", YELLOW_UP).steps);
  assert.deepEqual(run(g, ['L', 'D', "L'"]), ['step', 'step', 'done']);
  assert.ok(new StepFollower(expand('x y2', YELLOW_UP).steps).done);
});

test('a half turn written 2\' is still a half turn, either way', () => {
  const f = new StepFollower([{ token: "R2'", moves: ["R2'"] }]);
  assert.deepEqual(f.remaining(), ['R2']);
  assert.deepEqual(run(f, ['R', 'R']), ['ok', 'done']);
});

test('an empty algorithm is done from the start; any move is a mistake', () => {
  const f = new StepFollower(expand('', YELLOW_UP).steps);
  assert.ok(f.done);
  assert.deepEqual(f.remaining(), []);
  assert.equal(f.feed('R'), 'wrong');
  assert.deepEqual(f.undo, ["R'"]);
});

// Random user: mostly right, sometimes wrong, mostly undoing. At every point, undo (top first) + what's left of
// the step + the remaining steps must take the real cube to the algorithm's state.
test('follower never loses track of the real cube (random interleavings, mistakes and undos)', async () => {
  const { cube3x3x3 } = await import('cubing/puzzles');
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  let s = 1;
  const rnd = (k: number) => ((s = (s * 1103515245 + 12345) % 2 ** 31), s % k);
  const bases = ['U', 'D', 'R', 'L', 'F', 'B', 'u', 'd', 'r', 'l', 'f', 'b', 'Rw', 'M', 'E', 'S', 'x', 'y', 'z'];
  const quarters = ['U', 'D', 'R', 'L', 'F', 'B'].flatMap((m) => [m, m + "'"]);
  for (let trial = 0; trial < 300; trial++) {
    const alg = Array.from({ length: rnd(8) }, () => bases[rnd(bases.length)] + ['', "'", '2', "2'"][rnd(4)]).join(' ');
    const { steps } = expand(alg, YELLOW_UP);
    const target = solved.applyAlg(steps.flatMap((x) => x.moves).join(' '));
    const f = new StepFollower(steps);
    let p = solved;
    for (let guard = 0; !(f.done && !f.undo.length); guard++) {
      assert.ok(guard < 500, alg);
      const rem = f.remaining(), r = rnd(10);
      const pickRem = rem[rnd(rem.length)] ?? '';
      const m = f.undo.length && r < 7 ? f.undo.at(-1)! : r < 2 || !rem.length ? quarters[rnd(12)]
        : pickRem.endsWith('2') ? pickRem[0] + (rnd(2) ? "'" : '') : pickRem;
      f.feed(m);
      p = p.applyMove(m);
      const rest = [...f.undo].reverse().concat(f.remaining(), ...f.steps.slice(f.index + 1).map((x) => x.moves));
      assert.ok(p.applyAlg(rest.join(' ')).isIdentical(target), `${alg} after ${m}`);
    }
    assert.ok(p.isIdentical(target), alg);
  }
});

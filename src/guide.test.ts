import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion, Vector3 } from 'three';
import { cube3x3x3 } from 'cubing/puzzles';
import { describe, follow, PathGuide, relativePattern, toView, type Guide } from './guide.ts';
import type { KPattern } from 'cubing/kpuzzle';

test('toView renames faces for the viewer', () => {
  const z2 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI); // yellow up, green front
  assert.deepEqual(['U', "R'", 'F2', 'B', 'L', "D'"].map((m) => toView(m, z2)), ['D', "L'", 'F2', 'B', 'R', "U'"]);
  assert.equal(toView("R'", new Quaternion()), "R'");
  const y = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2); // front goes right
  assert.equal(toView('F', y), 'R');
});

test('follow advances on the planned move, half turns either way, null when off plan', () => {
  const g: Guide = { steps: ["R'", 'U2', 'F'], half: null };
  const a = follow(g, "R'")!;
  assert.deepEqual(a, { steps: ['U2', 'F'], half: null });
  const b = follow(a, "U'")!; // first half of U2, counter-clockwise
  assert.deepEqual(b, { steps: ['U2', 'F'], half: "U'" });
  assert.equal(follow(b, 'U'), null); // undoing it is off plan
  assert.deepEqual(follow(b, "U'"), { steps: ['F'], half: null });
  assert.equal(follow(g, 'R'), null);
  assert.equal(follow({ steps: [], half: null }, 'R'), null);
});

test('relativePattern: solving it is the path between two states', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  const from = solved.applyAlg("R U F' L2 D");
  const to = solved.applyAlg("B2 R' U D2 F");
  const path = "D' L2 F U' R' B2 R' U D2 F"; // undo `from`, then do `to`
  assert.ok(from.applyAlg(path).isIdentical(to));
  assert.ok(relativePattern(from, to).applyAlg(path).experimentalIsSolved({ ignorePuzzleOrientation: false, ignoreCenterOrientation: true }));
  assert.ok(relativePattern(to, to).isIdentical(solved));
});

test('describe names the face and the turn direction', () => {
  assert.equal(describe("R'"), 'Cara derecha, antihorario');
  assert.equal(describe('U2'), 'Cara arriba, media vuelta');
  assert.equal(describe('B'), 'Cara atrás, horario');
});

test('PathGuide: plans to the target, follows it, re-plans off plan, detects the goal', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  let pattern: KPattern | null = solved;
  let changes = 0;
  const g = new PathGuide(() => pattern, () => changes++); // real solver
  const goal = solved.applyAlg("R U F'");
  const turn = (m: string) => { pattern = pattern!.applyMove(m); g.onMove(m); };
  await g.start(Promise.resolve(goal));
  assert.equal(g.goal, goal);
  assert.ok(g.guide!.steps.length >= 3 && g.total === g.guide!.steps.length && changes >= 2);
  assert.ok(!g.reached());
  turn(g.guide!.steps[0].replace('2', '')); // first half of a half turn, or the whole quarter turn
  if (g.guide!.half) turn(g.guide!.half);
  assert.ok(g.guide!.steps.length >= 2, 'advanced on plan');
  const before = g.guide!.steps.slice();
  turn('B'); // off plan: undo it first, then the rest of the plan (unless B undoes into the next step's face)
  assert.deepEqual(g.guide!.steps.slice(-before.length + 1), before.slice(1));
  assert.equal(g.guide!.steps.length, before.length + (before[0][0] === 'B' ? 0 : 1));
  while (g.guide!.steps.length) turn(g.guide!.steps[0].endsWith('2') ? g.guide!.steps[0][0] : g.guide!.steps[0]);
  assert.ok(g.reached());
  g.stop();
  assert.equal(g.guide, null);
  assert.ok(!g.reached());
});

test('PathGuide: null target = solved; stale plans and pending targets are ignored', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  let pattern: KPattern | null = solved.applyMove('R');
  const plans: ((s: string[]) => void)[] = [];
  const g = new PathGuide(() => pattern, () => {}, () => new Promise((r) => plans.push(r)));
  let release!: (p: KPattern | null) => void;
  const started = g.start(new Promise((r) => (release = r)));
  pattern = solved;
  assert.ok(!g.reached(), 'target not known yet');
  await g.replan();
  assert.equal(plans.length, 0, 'no plan while the target is pending');
  pattern = solved.applyMove('R');
  release(null);
  await new Promise((r) => setTimeout(r));
  void g.replan(); // supersedes the first plan
  plans[0](['X']);
  plans[1](["R'"]);
  await started;
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(g.guide, { steps: ["R'"], half: null });
  pattern = solved;
  assert.ok(g.reached());
});

test('PathGuide: a valid hint is used instead of the solver; an invalid one is ignored', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  let pattern: KPattern | null = solved;
  let solverCalls = 0;
  const g = new PathGuide(() => pattern, () => {}, async () => (solverCalls++, ['X']));
  const goal = solved.applyAlg("R U R' U'");
  await g.start(goal, ['U', 'R', "U'", "R'"]); // backwards: not a route to the goal
  assert.deepEqual(g.guide!.steps, ['X']);
  assert.equal(solverCalls, 1);
  await g.start(goal, ['R', 'U', "R'", "U'"]);
  assert.deepEqual(g.guide!.steps, ['R', 'U', "R'", "U'"]);
  assert.equal(solverCalls, 1, 'the valid hint skipped the solver');
});

test('PathGuide: a wrong move is undone first and merged into the plan; the solver only wins if shorter', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  let pattern: KPattern | null = solved;
  const g = new PathGuide(() => pattern, () => {}, async () => ['L', 'L', 'L', 'L', 'L', 'L']); // a long "solver" plan
  const turn = (m: string) => { pattern = pattern!.applyMove(m); g.onMove(m); };
  await g.start(solved.applyAlg('R U F'), ['R', 'U', 'F']);
  turn('D'); // wrong: undo D, then R U F
  assert.deepEqual(g.guide!.steps, ["D'", 'R', 'U', 'F']);
  turn("D'");
  turn("R'"); // wrong the other way round: R + R = R2
  assert.deepEqual(g.guide!.steps, ['R2', 'U', 'F']);
  await new Promise((r) => setTimeout(r)); // the background solver plan (6 moves) must not replace a 3-step one
  assert.deepEqual(g.guide!.steps, ['R2', 'U', 'F']);
  turn('R'); turn('R'); turn('U'); turn('F');
  assert.ok(g.reached());
});

test('PathGuide: a full re-plan drops the stale plan, so a slip meanwhile re-plans instead of merging into it', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  let pattern: KPattern | null = solved;
  const plans: ((s: string[]) => void)[] = [];
  const g = new PathGuide(() => pattern, () => {}, () => new Promise((r) => plans.push(r)));
  const turn = (m: string) => { pattern = pattern!.applyMove(m); g.onMove(m); };
  await g.start(solved.applyAlg('R U F'), ['R', 'U', 'F']);
  pattern = solved.applyMove('D'); // re-synced: the R U F plan no longer applies
  void g.replan();
  assert.deepEqual(g.guide, { steps: [], half: null }, 'stale plan dropped while the solver works');
  turn('R'); // not following a stale step: a fresh plan from here
  assert.equal(plans.length, 2);
  plans[1](['X']);
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(g.guide!.steps, ['X']);
});

test('PathGuide: a plan followed to its end away from the target re-plans', async () => {
  const solved = (await cube3x3x3.kpuzzle()).defaultPattern();
  let pattern: KPattern | null = solved;
  let calls = 0;
  const g = new PathGuide(() => pattern, () => {}, async () => (calls++, ['Y']));
  await g.start(solved.applyAlg('R U'), ['R', 'U']);
  pattern = solved.applyAlg('D R'); // a lost move, not yet corrected: the plan ends elsewhere
  g.onMove('R');
  pattern = pattern.applyMove('U');
  g.onMove('U');
  assert.equal(calls, 1);
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(g.guide!.steps, ['Y']);
});

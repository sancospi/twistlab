import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion, Vector3 } from 'three';
import { cube3x3x3 } from 'cubing/puzzles';
import { follow, relativePattern, toView, type Guide } from './guide.ts';

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

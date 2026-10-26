import test from 'node:test';
import assert from 'node:assert/strict';
import { average, type Result } from './timer.ts';
import { bins, histogramSvg, rolling, summary, trendSvg } from './stats.ts';

const r = (...ms: (number | 'DNF')[]): Result[] => ms.map((m) => (m === 'DNF' ? { ms: 1, penalty: 'DNF' } : { ms: m, penalty: 0 }));

test('rolling averages match average() on every window', () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const res = Array.from({ length: 300 }, (): Result => (rand() < 0.05 ? { ms: 1, penalty: 'DNF' } : { ms: 8000 + Math.floor(rand() * 9000), penalty: rand() < 0.1 ? 2000 : 0 }));
  const values = res.map((x) => (x.penalty === 'DNF' ? Infinity : x.ms + x.penalty));
  for (const [n, trim] of [[3, 0], [5, 1], [12, 1], [50, 3], [100, 5]]) {
    const roll = rolling(values, n, trim);
    roll.forEach((v, i) => assert.equal(v, i + 1 < n ? null : average(res.slice(i - n + 1, i + 1).reverse(), n, trim), `ao${n} at ${i}`));
  }
});

test('summary: current and best of each average, counts and mean without DNFs', () => {
  // newest first: the list as stored
  const s = summary(r(12000, 'DNF', 10000, 11000, 14000, 9000));
  const row = (l: string) => s.rows.find((x) => x.label === l)!;
  assert.deepEqual(row('single'), { label: 'single', current: 12000, best: 9000 });
  assert.deepEqual(row('mo3'), { label: 'mo3', current: Infinity, best: 11330 }); // 9 14 11 -> 11.33; DNF in the last three
  assert.deepEqual(row('ao5'), { label: 'ao5', current: 12330, best: 11670 }); // 12 DNF 10 11 14 -> 11 12 14; DNF 10 11 14 9 -> 10 11 14
  assert.deepEqual(row('ao12'), { label: 'ao12', current: null, best: null });
  assert.equal(s.count, 6);
  assert.equal(s.dnf, 1);
  assert.equal(s.mean, 11200);
});

test('histogram bins: round width, slow outliers in the last bin', () => {
  assert.deepEqual(bins([10100, 10900, 11500, 12200, 12300]), { from: 10000, step: 200, counts: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2] });
  const b = bins([...Array(40).fill(10000), 300000]);
  assert.equal(b.counts.reduce((a, c) => a + c), 41);
  assert.ok(b.counts.length <= 12);
  assert.deepEqual(bins([Infinity]).counts, []);
  // too few solves for a percentile: the slowest keeps its own bar
  assert.deepEqual(bins([10000, 20000]), { from: 10000, step: 1000, counts: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] });
});

test('charts are labelled SVG with no NaN', () => {
  const values = [10000, Infinity, 12000, 11000, 9000, 13000];
  for (const s of [histogramSvg(values, 'Histograma <x>'), trendSvg(values, [{ cls: 'ao5', avgs: rolling(values, 5) }], 'Evolución'), trendSvg([Infinity], [], 'x')]) {
    assert.match(s, /^<svg [^>]*role="img"/);
    assert.doesNotMatch(s, /NaN|Infinity/);
  }
  assert.match(histogramSvg(values, 'Histograma <x>'), /aria-label="Histograma &lt;x&gt;\. 9–9.5 s: 1; 10–10.5 s: 1; 11–11.5 s: 1; 12–12.5 s: 1; ≥ 13 s: 1"/); // each non-empty bar, for screen readers
});

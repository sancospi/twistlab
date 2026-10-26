// Resolver statistics: current and best single / mo3 / aoN (WCA rules from timer.ts), and the stats dialog's
// hand-made SVG charts (histogram, trend). Pure: values in, numbers and SVG strings out.
import { resultValue, roundedMean, trimFor, type Result } from './timer.ts';

/** The averages shown, as [label, solves, trimmed at each end]. */
export const AVERAGES: [string, number, number][] = [
  ['mo3', 3, 0],
  ...[5, 12, 50, 100, 1000].map((n): [string, number, number] => [`ao${n}`, n, trimFor(n)]),
];

/** First index in sorted `a` whose value is >= v. */
function bisect(a: number[], v: number): number {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** The average of every window of `n` solves, oldest first: out[i] covers values[i-n+1..i] (null before n).
 * A sorted window updated by insert/remove keeps ao1000 over thousands of solves fast. */
export function rolling(values: number[], n: number, trim = trimFor(n)): (number | null)[] {
  const win: number[] = [];
  return values.map((v, i) => {
    win.splice(bisect(win, v), 0, v);
    if (i >= n) win.splice(bisect(win, values[i - n]), 1);
    return i + 1 < n ? null : roundedMean(win.slice(trim, n - trim));
  });
}

const minOf = (a: number[]) => a.reduce((m, v) => Math.min(m, v), Infinity);
/** Top of the charts' scale in sorted `s`: the 95th percentile, or the slowest while there are too few for one. */
const top95 = (s: number[]) => s[s.length < 20 ? s.length - 1 : Math.floor(0.95 * (s.length - 1))];

export interface StatRow { label: string; current: number | null; best: number | null }

/** Rows for the table (single first; Infinity = DNF, null = not enough solves), solve and DNF counts, mean of the finished ones. */
export function summary(results: Result[]) {
  const values = results.map(resultValue).reverse(); // results are newest first
  const rows: StatRow[] = [{ label: 'single', current: values.at(-1) ?? null, best: values.length ? minOf(values) : null }];
  for (const [label, n, trim] of AVERAGES) {
    const avgs = values.length < n ? [] : (rolling(values, n, trim).slice(n - 1) as number[]);
    rows.push({ label, current: avgs.at(-1) ?? null, best: avgs.length ? minOf(avgs) : null });
  }
  const done = values.filter(Number.isFinite);
  return { rows, count: values.length, dnf: values.length - done.length, mean: done.length ? roundedMean(done) : null };
}

/** Histogram of the finished times: a round bin width giving at most `maxBins` bins; slower than the 95th percentile
 * piles into the last bin, so one disaster doesn't squash the rest. */
export function bins(times: number[], maxBins = 12): { from: number; step: number; counts: number[] } {
  const s = times.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return { from: 0, step: 1000, counts: [] };
  const lo = s[0], hi = top95(s);
  const step = [100, 200, 500, 1000, 2000, 5000, 10000, 30000, 60000, 300000].find((st) => Math.floor(hi / st) - Math.floor(lo / st) < maxBins) ?? 600000;
  const from = Math.floor(lo / step) * step;
  const counts = Array<number>(Math.floor((hi - from) / step) + 1).fill(0);
  for (const v of s) counts[Math.min(counts.length - 1, Math.floor((v - from) / step))]++;
  return { from, step, counts };
}

/** Text safe in HTML and SVG, attributes included (seo.ts's pages use it too). */
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n: number) => +n.toFixed(1);
/** Axis label in seconds: "12", "12.5". */
const secs = (ms: number) => String(+(ms / 1000).toFixed(1));
const W = 320, H = 150, PAD = 18; // viewBox; bottom room for the axis labels
const svg = (label: string, body: string) =>
  `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;

/** Bar chart of bins(); each bar has a title ("10–11 s: 4") for hover, and the label lists them all for screen readers. */
export function histogramSvg(times: number[], label: string): string {
  const { from, step, counts } = bins(times);
  const top = Math.max(1, ...counts), bw = W / Math.max(1, counts.length);
  const every = Math.ceil(counts.length / 6); // at most ~6 axis labels at 320px
  const ranges: string[] = [];
  const bars = counts.map((c, i) => {
    const h = r1(((H - PAD - 12) * c) / top), x = r1(i * bw), a = from + i * step;
    const range = `${i === counts.length - 1 ? `≥ ${secs(a)} s` : `${secs(a)}–${secs(a + step)} s`}: ${c}`;
    if (c) ranges.push(range); // empty bars would only be noise
    return `<g><title>${esc(range)}</title><rect class="bar" x="${x + 1}" y="${r1(H - PAD - h)}" width="${r1(bw - 2)}" height="${h}"/>`
      + (c ? `<text x="${r1(x + bw / 2)}" y="${r1(H - PAD - h - 3)}" text-anchor="middle">${c}</text>` : '')
      + (i % every ? '' : `<text x="${x + 1}" y="${H - 4}">${secs(a)}</text>`) + '</g>';
  });
  return svg(`${label}. ${ranges.join('; ')}`, `<line class="axis" x1="0" x2="${W}" y1="${H - PAD}" y2="${H - PAD}"/>${bars.join('')}`);
}

/** Every solve as a dot (oldest left) plus the given rolling averages as lines; DNFs and gaps break the lines. */
export function trendSvg(values: number[], lines: { cls: string; avgs: (number | null)[] }[], label: string, opts: { scale?: number[]; xs?: [string, string] } = {}): string {
  const done = [...values, ...(opts.scale ?? [])].filter(Number.isFinite).sort((a, b) => a - b);
  if (!done.length) return svg(label, '');
  const lo = done[0], hi = Math.max(lo + 1000, top95(done)); // dots above the 95th percentile sit on the top edge
  const x = (i: number) => r1(values.length < 2 ? W / 2 : (i * (W - 4)) / (values.length - 1) + 2);
  const y = (v: number) => r1(4 + (H - PAD - 8) * (1 - (Math.min(v, hi) - lo) / (hi - lo)));
  const r = values.length > 300 ? 1 : 2;
  const dots = values.map((v, i) => (Number.isFinite(v) ? `<circle class="pt" cx="${x(i)}" cy="${y(v)}" r="${r}"/>` : '')).join('');
  const paths = lines.map(({ cls, avgs }) => {
    let d = '', pen = 'M';
    avgs.forEach((v, i) => {
      if (v === null || !Number.isFinite(v)) return void (pen = 'M');
      d += `${pen}${x(i)} ${y(v)}`;
      pen = 'L';
    });
    return `<path class="${cls}" d="${d}"/>`;
  }).join('');
  const axis = `<line class="axis" x1="0" x2="${W}" y1="${H - PAD}" y2="${H - PAD}"/>`
    + `<text x="2" y="12">${secs(hi)} s</text><text x="2" y="${H - PAD - 4}">${secs(lo)} s</text>` // y range
    + `<text x="2" y="${H - 4}">${opts.xs?.[0] ?? 1}</text><text x="${W - 2}" y="${H - 4}" text-anchor="end">${opts.xs?.[1] ?? values.length}</text>`; // solve numbers
  return svg(label, axis + dots + paths);
}

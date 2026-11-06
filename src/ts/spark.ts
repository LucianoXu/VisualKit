// A sparkline: a row of numbers as a line over a faint area, in a box CSS sizes (css/content.css,
// .vk-spark: as wide as its box, --spark-h high, in --c or the accent).
//
// It is drawn from numbers alone: every value is read as a number and written as digits, so nothing
// from data reaches the markup as text, and the result is safe to write with `html`. It carries no
// words either: say the number it ends on beside it, where it is read (it is hidden from assistive
// technology). Nothing in it moves, so there is nothing for reduced motion to stop.
//
//   html`<div class="metric"><span>Build time</span><b>${last}s</b></div>${sparkline(times, { threshold: 7 })}`

import { SafeHtml } from "./dom.ts";

export interface SparkOptions {
  /** the bottom of the scale (default: the least value, or 0 if that is above 0) */
  min?: number;
  /** the top of the scale (default: the greatest value, or the threshold if higher): a capacity */
  max?: number;
  /** a level to compare against, drawn as a dashed line: a budget, a limit */
  threshold?: number;
  /** a dot on the last value, the one said beside it (default true) */
  dot?: boolean;
}

/** the drawing's own units: stretched to the box (preserveAspectRatio none), its strokes not */
const W = 100;
const H = 32;
/** room above the top and under the bottom for the stroke and the dot */
const PAD = 2;

const f = (x: number): string => x.toFixed(2);
/** a number given in an option, or none */
const given = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** `values` (oldest first) as an SVG sparkline; what is not a finite number is left out. */
export function sparkline(values: readonly number[], o: SparkOptions = {}): SafeHtml {
  const vs: number[] = [];
  for (const v of values) if (typeof v === "number" && Number.isFinite(v)) vs.push(v);
  const open = `<svg class="vk-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">`;
  if (!vs.length) return new SafeHtml(`${open}</svg>`);
  // a loop, not Math.min(...vs): a long series would overflow the call's arguments
  let least = 0, most = -Infinity;
  for (const v of vs) {
    if (v < least) least = v;
    if (v > most) most = v;
  }
  const t = o.threshold === undefined ? null : given(o.threshold);
  if (t !== null && t > most) most = t;
  const lo = given(o.min) ?? least;
  let hi = given(o.max) ?? most;
  if (!(hi > lo)) hi = lo + 1;
  // halved, so that a range wider than the largest number (-1e308 to 1e308) is still finite
  const span = hi / 2 - lo / 2;
  const y = (v: number) => {
    const at = (Math.min(hi, Math.max(lo, v)) / 2 - lo / 2) / span;
    return H - PAD - (Number.isFinite(at) ? at : 0) * (H - 2 * PAD);
  };
  // one value: a level line across
  const pts = vs.length === 1 ? [[0, y(vs[0])], [W, y(vs[0])]] : vs.map((v, i) => [(i / (vs.length - 1)) * W, y(v)]);
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${f(x)} ${f(yy)}`).join("");
  // the area closes on zero where zero is on the scale, else on the bottom
  const base = f(y(0));
  const [lx, ly] = pts[pts.length - 1];
  return new SafeHtml(
    open +
      `<path class="a" d="${line}L${f(W)} ${base}L0.00 ${base}Z"/>` +
      (t === null ? "" : `<path class="t" d="M0.00 ${f(y(t))}H${f(W)}"/>`) +
      `<path class="l" d="${line}"/>` +
      // a zero-length stroke with a round cap: a dot the stretch does not make an ellipse
      (o.dot === false ? "" : `<path class="p" d="M${f(lx)} ${f(ly)}h0"/>`) +
      `</svg>`,
  );
}

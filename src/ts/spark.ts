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

/** A number, or 0: what is not a finite number never reaches the markup. */
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const f = (x: number): string => x.toFixed(2);

/** `values` (oldest first) as an SVG sparkline. */
export function sparkline(values: readonly number[], o: SparkOptions = {}): SafeHtml {
  const vs = values.map(num);
  const open = `<svg class="vk-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">`;
  if (!vs.length) return new SafeHtml(`${open}</svg>`);
  const t = o.threshold === undefined ? null : num(o.threshold);
  const lo = o.min === undefined ? Math.min(0, ...vs) : num(o.min);
  let hi = o.max === undefined ? Math.max(...vs, t ?? -Infinity) : num(o.max);
  if (!(hi > lo)) hi = lo + 1;
  const y = (v: number) => H - PAD - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - 2 * PAD);
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

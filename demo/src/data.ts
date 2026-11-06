// The demo's board: made-up things in groups, each of a kind, using a few before it.

import type { Item, Kind } from "./page.ts";

const GROUPS: [string, string[]][] = [
  ["Algebra", ["Group", "Ring", "Field", "Module", "Ideal", "Quotient", "Kernel", "Image", "Lagrange", "Sylow"]],
  ["Analysis", ["Limit", "Continuity", "Derivative", "Integral", "MeanValue", "Taylor", "Cauchy", "Uniform"]],
  ["Topology", ["Open", "Closed", "Compact", "Connected", "Hausdorff", "Tychonoff", "Urysohn"]],
  ["Geometry", ["Point", "Line", "Plane", "Angle", "Pythagoras", "Thales"]],
  ["Logic", ["Prop", "And", "Or", "Not", "Choice", "Excluded"]],
];

const KINDS: Kind[] = ["definition", "definition", "lemma", "theorem", "instance"];
const STATUS: Item["status"][] = ["ok", "ok", "ok", "ok", "running", "attention", "ok", "failed"];

/** The same board every time: a seeded generator. */
function rng(seed: number): () => number {
  return () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
}

export function makeItems(): Item[] {
  const r = rng(7);
  const out: Item[] = [];
  for (const [group, names] of GROUPS) {
    for (const [k, name] of names.entries()) {
      const kind: Kind = name === "Choice" || name === "Excluded" ? "axiom" : KINDS[Math.floor(r() * KINDS.length)];
      const before = out.filter(() => r() < 0.12).map((it) => it.id);
      out.push({
        id: `${group}.${name}`,
        name,
        group,
        kind,
        uses: before.slice(0, 5),
        status: STATUS[(k * 3 + group.length) % STATUS.length],
        note: `**${name}** is ${/^[aeiou]/.test(kind) ? "an" : "a"} ${kind} of _${group}_. It uses ${before.length ? before.slice(0, 3).map((u) => `\`${u}\``).join(", ") : "nothing"}.`,
      });
    }
  }
  return out;
}

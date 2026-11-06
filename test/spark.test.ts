// The sparkline and the player's clock, without a browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sparkline } from "../src/ts/spark.ts";
import { clock } from "../src/ts/player.ts";
import { ICON_NAMES, icon } from "../src/ts/icons.ts";

test("sparkline draws the values from 0 up to the greatest, oldest at the left", () => {
  const s = String(sparkline([0, 1, 2]));
  assert.match(s, /^<svg class="vk-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"/);
  assert.match(s, /<path class="l" d="M0\.00 30\.00L50\.00 16\.00L100\.00 2\.00"\/>/);
  // the area closes on zero; the dot is on the last value
  assert.match(s, /<path class="a" d="M0\.00 30\.00L50\.00 16\.00L100\.00 2\.00L100\.00 30\.00L0\.00 30\.00Z"\/>/);
  assert.match(s, /<path class="p" d="M100\.00 2\.00h0"\/>/);
});

test("sparkline: a threshold above the values sets the top; a fixed max clamps", () => {
  assert.match(String(sparkline([1, 1], { threshold: 2 })), /<path class="t" d="M0\.00 2\.00H100\.00"\/>.*<path class="l" d="M0\.00 16\.00L100\.00 16\.00"\/>/);
  assert.match(String(sparkline([5, 50], { max: 10, dot: false })), /<path class="l" d="M0\.00 16\.00L100\.00 2\.00"\/><\/svg>$/);
});

test("sparkline: no values draw nothing, one draws a level", () => {
  assert.equal(String(sparkline([])), `<svg class="vk-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true" focusable="false"></svg>`);
  assert.match(String(sparkline([3])), /class="l" d="M0\.00 2\.00L100\.00 2\.00"/);
});

test("sparkline writes only digits from its values: what is not a finite number is 0", () => {
  const bad = ["<script>", '"onload="x', NaN, Infinity, 2] as unknown as number[];
  const s = String(sparkline(bad, { threshold: "<b>" as unknown as number }));
  assert.doesNotMatch(s, /script|onload|NaN|Infinity|<b>/);
  assert.match(s, /class="l" d="M0\.00 30\.00L25\.00 30\.00L50\.00 30\.00L75\.00 30\.00L100\.00 2\.00"/);
});

test("clock writes m:ss, and h:mm:ss from an hour", () => {
  assert.equal(clock(0), "0:00");
  assert.equal(clock(75.9), "1:15");
  assert.equal(clock(3600 + 62), "1:01:02");
  assert.equal(clock(-3), "0:00");
});

test("the player's icons are drawn like the others: strokes only", () => {
  for (const n of ["play", "pause", "filter"] as const) {
    assert.ok(ICON_NAMES.includes(n));
    assert.doesNotMatch(icon(n), /fill=/);
  }
});

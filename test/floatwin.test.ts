// The floating windows' geometry, without a browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cascadeRect, clampRect, EDGE, moveRect, placeOf, raise, readKept, rectOf, resizeRect, snapRect } from "../src/ts/floatwin.ts";

const vp = { w: 1200, h: 800 };
const min = { w: 200, h: 120 };

test("a rect is brought inside the viewport, a margin from its edges", () => {
  assert.deepEqual(clampRect({ x: -50, y: 900, w: 300, h: 200 }, vp, min), { x: EDGE, y: vp.h - EDGE - 200, w: 300, h: 200 });
  // larger than the viewport: as large as it less its margins
  assert.deepEqual(clampRect({ x: 0, y: 0, w: 5000, h: 5000 }, vp, min), { x: EDGE, y: EDGE, w: vp.w - 2 * EDGE, h: vp.h - 2 * EDGE });
});

test("a window near an edge snaps onto its line", () => {
  assert.equal(snapRect({ x: EDGE + 7, y: 300, w: 300, h: 200 }, vp).x, EDGE);
  assert.equal(snapRect({ x: vp.w - EDGE - 300 - 5, y: 300, w: 300, h: 200 }, vp).x, vp.w - EDGE - 300);
  assert.equal(snapRect({ x: 400, y: 300, w: 300, h: 200 }, vp).x, 400);
});

test("a drag moves it and keeps it inside", () => {
  const r = moveRect({ x: 100, y: 100, w: 300, h: 200 }, 2000, 0, vp, min);
  assert.equal(r.x, vp.w - EDGE - 300);
});

test("a resize from the west edge keeps the east edge, and stops at the least width", () => {
  const r = resizeRect({ x: 400, y: 100, w: 300, h: 200 }, "w", 250, 0, vp, min);
  assert.equal(r.x + r.w, 700);
  assert.equal(r.w, min.w);
});

test("a place is kept by its nearest corner and read back in another viewport", () => {
  const r = { x: 900, y: 550, w: 280, h: 230 };
  const p = placeOf(r, vp);
  assert.equal(p.right, true);
  assert.equal(p.bottom, true);
  const wider = rectOf(p, { w: 1600, h: 800 }, min);
  assert.equal(1600 - wider.x - wider.w, vp.w - r.x - r.w);
});

test("what is kept is read with care", () => {
  assert.deepEqual(readKept(null), {});
  assert.deepEqual(readKept({ place: { x: "1" }, collapsed: "yes" }), {});
  assert.deepEqual(readKept({ place: { x: 1, y: 2, w: 3, h: 4, right: true }, collapsed: true }), { place: { x: 1, y: 2, w: 3, h: 4, right: true }, collapsed: true });
});

test("a window opened beside another steps down and right, never onto a third", () => {
  const from = { x: 100, y: 100, w: 300, h: 200 };
  const one = cascadeRect(from, [], vp, min);
  assert.deepEqual([one.x, one.y], [128, 128]);
  const two = cascadeRect(from, [one], vp, min);
  assert.deepEqual([two.x, two.y], [156, 156]);
});

test("raise puts one in front, the rest in their order", () => {
  assert.deepEqual(raise(["a", "b", "c"], "a"), ["b", "c", "a"]);
});

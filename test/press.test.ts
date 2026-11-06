// A region drawn again by itself, held while a press is in progress in it (focus.ts, holdPress).
import { test } from "node:test";
import assert from "node:assert/strict";
import { holdPress } from "../src/ts/focus.ts";

/** A document with its window, as event targets; its listeners counted. */
function docOf() {
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { defaultView: win, visibilityState: "visible", added: 0 });
  const add = doc.addEventListener.bind(doc);
  doc.addEventListener = (...a: Parameters<EventTarget["addEventListener"]>) => (doc.added++, add(...a));
  return doc;
}
/** A root in a document, and its draws counted. */
function made(doc = docOf(), max?: number) {
  const root = Object.assign(new EventTarget(), { ownerDocument: doc });
  const seen = { draws: 0 };
  const draw = holdPress(root, () => seen.draws++, max === undefined ? {} : { max });
  return { doc, root, seen, draw };
}
const fire = (on: EventTarget, type: string, props: object = {}) => on.dispatchEvent(Object.assign(new Event(type), props));
const later = (ms = 0) => new Promise((r) => setTimeout(r, ms));

test("holdPress draws at once when nothing is pressed", () => {
  const { seen, draw } = made();
  draw();
  draw();
  assert.equal(seen.draws, 2);
});

test("holdPress holds draws under a pointer press, then draws once after the release", async () => {
  const { doc, root, seen, draw } = made();
  fire(root, "pointerdown", { pointerId: 1 });
  draw();
  draw();
  assert.equal(seen.draws, 0);
  // released anywhere in the document
  fire(doc, "pointerup", { pointerId: 1 });
  assert.equal(seen.draws, 0, "not before the release's click");
  await later();
  assert.equal(seen.draws, 1);
});

test("holdPress: a click that draws after the release leaves nothing held; no draw, nothing after", async () => {
  const { doc, root, seen, draw } = made();
  fire(root, "pointerdown", { pointerId: 1 });
  draw();
  fire(doc, "pointerup", { pointerId: 1 });
  draw(); // the click's own draw
  await later();
  assert.equal(seen.draws, 1);
  fire(root, "pointerdown", { pointerId: 1 });
  fire(doc, "pointerup", { pointerId: 1 });
  await later();
  assert.equal(seen.draws, 1);
});

test("holdPress holds until the last of several pointers is released", async () => {
  const { doc, root, seen, draw } = made();
  fire(root, "pointerdown", { pointerId: 1 });
  fire(root, "pointerdown", { pointerId: 2 });
  draw();
  fire(doc, "pointerup", { pointerId: 1 });
  await later();
  assert.equal(seen.draws, 0);
  fire(doc, "pointercancel", { pointerId: 2 });
  await later();
  assert.equal(seen.draws, 1);
});

test("holdPress holds under Space, which acts on its release, and not under Enter", async () => {
  const { doc, root, seen, draw } = made();
  fire(root, "keydown", { key: "Enter" });
  draw();
  assert.equal(seen.draws, 1);
  fire(root, "keydown", { key: " " });
  draw();
  fire(doc, "keyup", { key: "Shift" });
  assert.equal(seen.draws, 1);
  fire(doc, "keyup", { key: " " });
  await later();
  assert.equal(seen.draws, 2);
});

test("holdPress lets go of a press it can no longer hear end", async () => {
  const { doc, root, seen, draw } = made();
  const step = async (start: () => void, end: () => void) => {
    start();
    draw();
    end();
    await later();
  };
  // released outside the window: the next move has no button down
  await step(() => fire(root, "pointerdown", { pointerId: 1 }), () => fire(doc, "pointermove", { buttons: 0 }));
  assert.equal(seen.draws, 1);
  await step(() => fire(root, "keydown", { key: " " }), () => fire(root, "focusout"));
  assert.equal(seen.draws, 2);
  await step(() => fire(root, "pointerdown", { pointerId: 1 }), () => fire(doc.defaultView, "blur"));
  assert.equal(seen.draws, 3);
  await step(() => fire(root, "pointerdown", { pointerId: 1 }), () => ((doc.visibilityState = "hidden"), fire(doc, "visibilitychange")));
  assert.equal(seen.draws, 4);
});

test("holdPress holds no longer than its cap after the press's last event", async () => {
  const { doc, root, seen, draw } = made(docOf(), 30);
  fire(root, "pointerdown", { pointerId: 1 });
  draw();
  await later(20);
  // a drag goes on: the cap starts again
  fire(doc, "pointermove", { pointerId: 1, buttons: 1 });
  await later(20);
  assert.equal(seen.draws, 0);
  await later(30);
  assert.equal(seen.draws, 1);
  // the pointer is still down, but no longer holds
  draw();
  assert.equal(seen.draws, 2);
});

test("holdPress keeps a slow click: a 3 s press still holds by default", async () => {
  const { doc, root, seen, draw } = made();
  fire(root, "pointerdown", { pointerId: 1 });
  draw();
  await later(3000);
  assert.equal(seen.draws, 0, "still held after 3 s");
  fire(doc, "pointerup", { pointerId: 1 });
  await later();
  assert.equal(seen.draws, 1);
});

test("holdPress: one set of document listeners for every root in it", () => {
  const doc = docOf();
  made(doc);
  const once = doc.added;
  for (let i = 0; i < 50; i++) made(doc);
  assert.equal(doc.added, once);
});

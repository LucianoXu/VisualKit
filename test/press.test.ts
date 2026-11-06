// A region drawn again by itself, held while a press is in progress in it (focus.ts, holdPress).
import { test } from "node:test";
import assert from "node:assert/strict";
import { holdPress } from "../src/ts/focus.ts";

/** A root in its document, as event targets, and its draws counted. */
function made() {
  const doc = new EventTarget();
  const root = Object.assign(new EventTarget(), { ownerDocument: doc });
  const seen = { draws: 0 };
  const draw = holdPress(root, () => seen.draws++);
  const fire = (on: EventTarget, type: string, props: object = {}) => on.dispatchEvent(Object.assign(new Event(type), props));
  return { doc, root, seen, draw, fire };
}
const nextTask = () => new Promise((r) => setTimeout(r, 0));

test("holdPress draws at once when nothing is pressed", () => {
  const { seen, draw } = made();
  draw();
  draw();
  assert.equal(seen.draws, 2);
});

test("holdPress holds draws under a pointer press, then draws once after the release", async () => {
  const { doc, root, seen, draw, fire } = made();
  fire(root, "pointerdown");
  draw();
  draw();
  assert.equal(seen.draws, 0);
  // released anywhere in the document
  fire(doc, "pointerup");
  assert.equal(seen.draws, 0, "not before the release's click");
  await nextTask();
  assert.equal(seen.draws, 1);
});

test("holdPress: a click that draws after the release leaves nothing held", async () => {
  const { doc, root, seen, draw, fire } = made();
  fire(root, "pointerdown");
  draw();
  fire(doc, "pointerup");
  draw(); // the click's own draw
  await nextTask();
  assert.equal(seen.draws, 1);
});

test("holdPress: a press with no draw under it draws nothing after", async () => {
  const { doc, root, seen, fire } = made();
  fire(root, "pointerdown");
  fire(doc, "pointerup");
  await nextTask();
  assert.equal(seen.draws, 0);
});

test("holdPress holds under Space, which acts on its release, and not under Enter", async () => {
  const { doc, root, seen, draw, fire } = made();
  fire(root, "keydown", { key: "Enter" });
  draw();
  assert.equal(seen.draws, 1);
  fire(root, "keydown", { key: " " });
  draw();
  fire(doc, "keyup", { key: "Shift" });
  assert.equal(seen.draws, 1);
  fire(doc, "keyup", { key: " " });
  await nextTask();
  assert.equal(seen.draws, 2);
});

test("holdPress lets go of a press it can no longer hear end", async () => {
  const { doc, root, seen, draw, fire } = made();
  fire(root, "pointerdown");
  draw();
  fire(doc, "pointermove", { buttons: 1 });
  await nextTask();
  assert.equal(seen.draws, 0, "still pressed");
  // released outside the window: the next move has no button down
  fire(doc, "pointermove", { buttons: 0 });
  await nextTask();
  assert.equal(seen.draws, 1);
  fire(root, "keydown", { key: " " });
  draw();
  fire(root, "focusout");
  await nextTask();
  assert.equal(seen.draws, 2);
  fire(root, "pointerdown");
  draw();
  fire(doc, "pointercancel");
  await nextTask();
  assert.equal(seen.draws, 3);
});

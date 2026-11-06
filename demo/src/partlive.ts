// The live updates: the board builds by itself, a tick at a time — what was running finishes, fine or
// failed, and something else starts — and every region showing a status is drawn again. The bar's
// pill says how many are building.
//
// The side panel and the drawer are drawn on every tick, under the reader's pointer: they draw through
// `holdPress` (src/ts/focus.ts), so a click on a row is not lost to a tick between its press and its
// release.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, html } from "../../src/ts/index.ts";
import type { Page } from "./page.ts";

export type LivePart = object;

/** a tick every so many milliseconds */
const EVERY = 1200;

export function livePart(page: Page): LivePart {
  const pill = $("#status");
  // the same run every time
  let seed = 11;
  const r = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

  const step = () => {
    for (const it of page.items) if (it.status === "running" && r() < 0.4) it.status = r() < 0.85 ? "ok" : "failed";
    const fine = page.items.filter((it) => it.status === "ok");
    if (fine.length && r() < 0.7) fine[Math.floor(r() * fine.length)].status = "running";
    page.tick++;
    const n = page.items.filter((it) => it.status === "running").length;
    pill.innerHTML = String(n ? html`<span class="vk-dot running"></span><span>Building ${n}</span>` : html`<span class="vk-dot ok"></span><span>Ready</span>`);
    page.refresh();
  };
  setInterval(step, EVERY);
  return {};
}

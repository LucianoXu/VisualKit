// The live updates: a recorded run of the board, played back — a tick a second of the run, what was
// running finishes, fine or failed, something else starts, a failure is built again — and every
// region showing a status is drawn again. The bar's pill says how many are building. The player
// (partplayer.ts) plays, pauses, scrubs and sets the speed; the run is seeded, so any second of it is
// found again by playing it from the start.
//
// The side panel and the drawer are drawn on every tick, under the reader's pointer: they draw through
// `holdPress` (src/ts/focus.ts), so a click on a row is not lost to a tick between its press and its
// release.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, html } from "../../src/ts/index.ts";
import { TICKS } from "./page.ts";
import type { Item, Page } from "./page.ts";

export interface LivePart {
  /** play, or pause (`on` says which; else the other); played to the end, from the start again */
  play(on?: boolean): void;
  /** go to `t` seconds into the run */
  seekTo(t: number): void;
  setSpeed(s: number): void;
  /** the last `n` build times of a thing, in seconds, up to the tick on show: for its sparkline */
  buildTimes(id: string, n: number): number[];
}

/** how often the clock is read while playing, in milliseconds */
const FRAME = 100;

export function livePart(page: Page): LivePart {
  const pill = $("#status");
  const start = new Map(page.items.map((it) => [it.id, it.status]));
  const index = new Map(page.items.map((it, k) => [it.id, k]));
  let seed = 11;
  const r = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

  /** one second of the run */
  const step = () => {
    for (const it of page.items) {
      if (it.status === "running" && r() < 0.4) it.status = r() < 0.85 ? "ok" : "failed";
      // what failed is fixed and built again, in time
      else if (it.status === "failed" && r() < 0.06) it.status = "running";
    }
    const fine = page.items.filter((it) => it.status === "ok");
    if (fine.length && r() < 0.7) fine[Math.floor(r() * fine.length)].status = "running";
  };
  /** the board at tick `k`: the run played from its start */
  const goTo = (k: number) => {
    if (k < page.tick) {
      seed = 11;
      for (const it of page.items) it.status = start.get(it.id) as Item["status"];
      page.tick = 0;
    }
    for (; page.tick < k; page.tick++) step();
    const n = page.items.filter((it) => it.status === "running").length;
    pill.innerHTML = String(n ? html`<span class="vk-dot running"></span><span>Building ${n}</span>` : html`<span class="vk-dot ok"></span><span>Ready</span>`);
    page.refresh();
  };

  let timer = 0;
  let was = 0;
  const frame = () => {
    const now = performance.now();
    page.time = Math.min(TICKS, page.time + ((now - was) / 1000) * page.speed);
    was = now;
    if (page.time >= TICKS) play(false);
    if (Math.floor(page.time) !== page.tick) goTo(Math.floor(page.time));
    page.drawPlayer();
  };
  const play = (on = !page.playing) => {
    if (on && page.time >= TICKS) seekTo(0);
    page.playing = on;
    clearInterval(timer);
    if (on) {
      was = performance.now();
      timer = window.setInterval(frame, FRAME);
    }
    page.drawPlayer();
  };
  const seekTo = (t: number) => {
    page.time = Math.max(0, Math.min(TICKS, t));
    if (Math.floor(page.time) !== page.tick) goTo(Math.floor(page.time));
    page.drawPlayer();
  };

  /** a build time for thing `i` at tick `k`: made up, the same every time */
  const buildTime = (i: number, k: number) => {
    const noise = Math.abs(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
    return Math.max(0.4, 3.2 + (i % 5) * 0.6 + 1.8 * Math.sin(k / 5 + i) + noise * 2.2);
  };

  return {
    play,
    seekTo,
    setSpeed(s) {
      page.speed = s;
      page.drawPlayer();
    },
    buildTimes(id, n) {
      const i = index.get(id) ?? 0;
      const out: number[] = [];
      for (let k = Math.max(0, page.tick - n + 1); k <= page.tick; k++) out.push(buildTime(i, k));
      return out;
    },
  };
}

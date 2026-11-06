// The floating windows: a note window per thing the reader pins (each opened a step from the last),
// the inspector (fitted to its content, at the bottom right), and Activity (kept where the reader
// put it, in this browser).
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, cascadeRect, EDGE, FloatWindow, html, icon, raw, storageKeeper, markdown, fitBox } from "../../src/ts/index.ts";
import type { Rect } from "../../src/ts/index.ts";
import type { Page } from "./page.ts";

export interface WindowsPart {
  openNote(id: string): void;
  openActivity(): void;
  drawInspector(): void;
}

/** A window's markup: its title bar, its body, its pill. */
function shell(title: string, sub: string, body: string, closeable = true): string {
  return String(html`<div class="vk-win-box">
      <header class="vk-win-head"><span class="vk-win-title">${title}</span><span class="vk-win-sub">${sub}</span>
        <span class="vk-win-acts"><button class="vk-icon" data-collapse aria-label="Collapse" title="Collapse (double-click the bar)">${raw(icon("collapse", 14))}</button>${closeable ? html`<button class="vk-icon" data-close aria-label="Close">${raw(icon("close", 12))}</button>` : ""}</span></header>
      <div class="vk-win-body">${raw(body)}</div>
    </div>
    <div class="vk-win-pill"><button class="vk-win-pill-open" data-open><span>${title}</span></button></div>`);
}

export function windowsPart(page: Page): WindowsPart {
  const layer = $("#windows");
  const notes = new Map<string, FloatWindow>();

  const make = (cls: string, inner: string) => {
    const el = document.createElement("section");
    el.className = `vk-win ${cls}`;
    el.tabIndex = -1;
    el.innerHTML = inner;
    layer.append(el);
    return el;
  };

  const openNote = (id: string) => {
    const it = page.byId.get(id)!;
    const had = notes.get(id);
    if (had) return void (had.front(), had.el.focus());
    const el = make("pinned full", shell(it.name, it.group, `<div class="note-body"><div class="vk-md">${markdown(it.note)}</div><textarea class="vk-textarea" placeholder="Your note…"></textarea></div>`));
    const from: Rect = { x: 320, y: 120, w: 340, h: 300 };
    const taken = [...notes.values()].map((w) => w.rect);
    const win = new FloatWindow(el, { min: { w: 240, h: 160 } });
    win.ownPlace(cascadeRect(from, taken, { w: innerWidth, h: innerHeight }, { w: 240, h: 160 }, 110));
    notes.set(id, win);
    const box = el.querySelector("textarea")!;
    box.addEventListener("input", () => fitBox(box));
    el.addEventListener("click", (e) => {
      if (!(e.target as Element).closest("[data-close]")) return;
      win.dispose();
      el.remove();
      notes.delete(id);
    });
    el.focus();
  };

  // ---------------------------------------------------------------- Activity
  let activity: FloatWindow | null = null;
  const openActivity = () => {
    if (activity) {
      activity.el.hidden = false;
      activity.layout();
      return activity.front();
    }
    const day = (d: string, rows: [string, string][]) =>
      html`<div class="vk-day">${d}</div>${rows.map(([t, s]) => html`<div class="vk-event"><span class="vk-event-time">${t}</span><span>${raw(s)}</span></div>`)}`;
    const body = String(html`${day("Today", [
      ["14:02", "<b>Ada</b> approved <code>Algebra.Lagrange</code>"],
      ["13:40", "A build finished: <span class='vk-chip ok'>all green</span>"],
      ["11:15", "<b>Reviewer</b> <span class='vk-muted'>(agent)</span> commented on <code>Analysis.Taylor</code>"],
    ])}${day("Yesterday", [["18:30", "<b>Grace</b> made the view <i>Algebra review</i>"]])}`);
    const el = make("", shell("Activity", "on this board", body));
    activity = new FloatWindow(el, {
      min: { w: 280, h: 200 },
      keeper: storageKeeper("visualkit-demo:activity"),
      keepsCollapsed: true,
      start: (vp) => ({ x: vp.w - 360 - EDGE, y: 120, w: 360, h: 320 }),
    });
    el.addEventListener("click", (e) => {
      if ((e.target as Element).closest("[data-close]")) el.hidden = true;
    });
  };

  // ---------------------------------------------------------------- the inspector
  const insEl = make("inspector-win", shell("Inspector", "", `<div class="inspector" id="inspector"></div>`, false));
  const inspector = new FloatWindow(insEl, {
    min: { w: 220, h: 100 },
    keeper: storageKeeper("visualkit-demo:inspector"),
    keepsCollapsed: true,
    fit: {
      bounds: (vp) => ({ max: { w: Math.min(360, vp.w - 2 * EDGE), h: vp.h / 2 }, min: { w: 220, h: 80 } }),
      // at the bottom right of the board: beside the drawer while it is open, never over it
      at: (s, vp) => {
        const right = parseFloat(document.documentElement.style.getPropertyValue("--inset-right")) || 0;
        return { x: Math.max(EDGE, vp.w - s.w - EDGE - (right ? right + 8 : 0)), y: vp.h - s.h - EDGE, ...s };
      },
    },
  });
  const drawInspector = () => {
    const box = $("#inspector");
    const it = page.selected ? page.byId.get(page.selected) : null;
    box.innerHTML = it
      ? String(html`<dl class="vk-dl" style="border:0;padding:0;margin:0"><dt>Name</dt><dd class="vk-mono">${it.id}</dd><dt>Kind</dt><dd>${it.kind}</dd><dt>Status</dt><dd><span class="vk-dot ${it.status}"></span> ${it.status}</dd><dt>Mode</dt><dd>${page.mode}</dd></dl>`)
      : `<span class="vk-muted">Select something on the board, or right-click it.</span>`;
    inspector.layout();
  };

  return { openNote, openActivity, drawInspector };
}

// The ground: the board drawn on a canvas, in the theme's colours, read from the tokens as it draws
// and drawn again when the theme changes. Groups are discs; things are dots in their kind's colour;
// what the selection lights stays, the rest steps back.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, onThemeChange, token } from "../../src/ts/index.ts";
import { KIND_COLOUR, lit } from "./page.ts";
import type { Page } from "./page.ts";

export interface CanvasPart {
  /** draw the board again */
  draw(): void;
  /** the thing under a point of the window, or null */
  itemAt(x: number, y: number): string | null;
  /** where a thing is drawn, in the window */
  whereIs(id: string): { x: number; y: number } | null;
  /** select a thing (null: nothing), going there in the history unless `go` is false */
  select(id: string | null, go?: boolean): void;
  /** draw every part from the page's state */
  refresh(): void;
}

interface Placed {
  x: number;
  y: number;
}

export function canvasPart(page: Page): CanvasPart {
  const cv = $<HTMLCanvasElement>("#canvas");
  const ctx = cv.getContext("2d")!;
  let at = new Map<string, Placed>();
  let discs: { group: string; x: number; y: number; r: number }[] = [];
  let hover: string | null = null;
  const R = 7;

  /** The groups as discs in the room the panels leave, their things on a spiral inside. */
  const layout = () => {
    const root = getComputedStyle(document.documentElement);
    const left = parseFloat(root.getPropertyValue("--inset-left")) || 0;
    const right = parseFloat(root.getPropertyValue("--inset-right")) || 0;
    const w = innerWidth - left - right, h = innerHeight - 110 - 50;
    const groups = [...new Set(page.items.map((it) => it.group))];
    const cols = Math.ceil(Math.sqrt(groups.length * (w / Math.max(h, 1))));
    const rows = Math.ceil(groups.length / cols);
    const cell = Math.min(w / cols, h / rows);
    at = new Map();
    discs = [];
    groups.forEach((g, k) => {
      const col = k % cols, row = Math.floor(k / cols);
      const inRow = Math.min(cols, groups.length - row * cols);
      const cx = left + (w - inRow * cell) / 2 + (col + 0.5) * cell;
      const cy = 110 + (h - rows * cell) / 2 + (row + 0.5) * cell;
      const members = page.items.filter((it) => it.group === g);
      const r = Math.min(cell * 0.42, 22 + Math.sqrt(members.length) * 16);
      discs.push({ group: g, x: cx, y: cy, r });
      members.forEach((it, i) => {
        const a = i * 2.39996, d = (r - 16) * Math.sqrt((i + 0.5) / members.length);
        at.set(it.id, { x: cx + d * Math.cos(a), y: cy + 6 + d * Math.sin(a) });
      });
    });
  };

  const draw = () => {
    const dpr = devicePixelRatio || 1;
    if (cv.width !== Math.round(innerWidth * dpr) || cv.height !== Math.round(innerHeight * dpr)) {
      cv.width = Math.round(innerWidth * dpr);
      cv.height = Math.round(innerHeight * dpr);
    }
    layout();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const font = token("--font");
    const on = lit(page);
    const some = on.size > 0;

    for (const d of discs) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = token("--code-bg");
      ctx.fill();
      ctx.strokeStyle = token("--line");
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = token("--text-2");
      ctx.font = `600 11px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(d.group.toUpperCase(), d.x, d.y - d.r + 16);
    }

    // what the selection lights, joined to it
    if (page.selected) {
      const s = at.get(page.selected)!;
      ctx.strokeStyle = token("--accent");
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.5;
      for (const id of on) {
        if (id === page.selected) continue;
        const p = at.get(id)!;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo((s.x + p.x) / 2, Math.min(s.y, p.y) - 30, p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    for (const it of page.items) {
      const p = at.get(it.id)!;
      ctx.globalAlpha = some && !on.has(it.id) ? 0.22 : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.fillStyle = token(KIND_COLOUR[it.kind]);
      ctx.fill();
      if (it.status === "failed") {
        ctx.strokeStyle = token("--st-failed");
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // the selected, ringed in the accent; it and the one under the pointer named
    for (const id of [page.selected, hover]) {
      if (!id) continue;
      const p = at.get(id)!;
      if (id === page.selected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, R + 4, 0, Math.PI * 2);
        ctx.strokeStyle = token("--accent");
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.font = `600 12.5px ${font}`;
      ctx.textAlign = "left";
      ctx.lineWidth = 4;
      ctx.strokeStyle = token("--canvas");
      ctx.strokeText(page.byId.get(id)!.name, p.x + R + 7, p.y + 4);
      ctx.fillStyle = token("--text");
      ctx.fillText(page.byId.get(id)!.name, p.x + R + 7, p.y + 4);
    }
  };

  const itemAt = (x: number, y: number) => {
    let best: string | null = null, d = (R + 4) ** 2;
    for (const [id, p] of at) {
      const e = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (e < d) [best, d] = [id, e];
    }
    return best;
  };

  cv.addEventListener("pointermove", (e) => {
    const h = itemAt(e.clientX, e.clientY);
    cv.style.cursor = h ? "pointer" : "default";
    if (h === hover) return;
    hover = h;
    draw();
  });
  cv.addEventListener("click", (e) => page.select(itemAt(e.clientX, e.clientY)));
  addEventListener("resize", () => draw());
  onThemeChange(() => draw());

  return {
    draw,
    itemAt,
    whereIs: (id) => at.get(id) ?? null,
    select(id, go = true) {
      if (id === page.selected) return;
      page.selected = id;
      if (go) {
        page.history = [...page.history.slice(0, page.at + 1), id];
        page.at = page.history.length - 1;
      }
      page.refresh();
    },
    refresh() {
      page.drawDrawer();
      page.drawSide();
      page.syncNav();
      page.drawInspector();
      // after the drawer, whose room the board leaves
      requestAnimationFrame(() => draw());
    },
  };
}

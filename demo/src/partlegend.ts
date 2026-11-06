// The legend: folded to a chip at the bottom left of the board, open to a card of the kinds and
// their counts.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, html, kept, isBool, keepFocus } from "../../src/ts/index.ts";
import { KIND_COLOUR } from "./page.ts";
import type { Kind, Page } from "./page.ts";

export interface LegendPart {
  drawLegend(): void;
}

export function legendPart(page: Page): LegendPart {
  const el = $("#legend");
  const open = kept("visualkit-demo:legend", false, isBool);
  const kinds = Object.keys(KIND_COLOUR) as Kind[];
  const swatch = `conic-gradient(${kinds.map((k, i) => `var(${KIND_COLOUR[k]}) 0 ${((i + 1) / kinds.length) * 100}%`).join(", ")})`;

  const drawLegend = () =>
    keepFocus(el, () => {
      el.innerHTML = open.get()
        ? String(html`<div class="vk-card vk-glass">
            <div class="vk-drawer-head" style="margin:0"><b>Kinds</b><button class="vk-icon" data-fold aria-label="Fold the legend">▾</button></div>
            ${kinds.map((k) => html`<div class="vk-key" style="--c: var(${KIND_COLOUR[k]})"><i></i><b>${k}</b><span>${page.items.filter((it) => it.kind === k).length}</span></div>`)}
            <div class="vk-meter" title="Status" style="margin-top:4px">
              ${(["ok", "running", "attention", "failed"] as const).map((s) => html`<i style="flex:${page.items.filter((it) => it.status === s).length}; --c: var(--st-${s})"></i>`)}
            </div></div>`)
        : String(html`<button class="vk-chipbtn" data-fold aria-expanded="false"><span style="width:10px;height:10px;border-radius:50%;background:${swatch}"></span>Kinds<span class="vk-muted vk-num">${page.items.length}</span></button>`);
    });
  el.addEventListener("click", (e) => {
    if (!(e.target as Element).closest("[data-fold]")) return;
    open.set(!open.get());
    drawLegend();
  });
  drawLegend();
  return { drawLegend };
}

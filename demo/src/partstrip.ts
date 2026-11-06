// The strip under the bar: the tabs at the left, the modes at the right — each mode's hint under its
// button, said there and nowhere else.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, html, hint } from "../../src/ts/index.ts";
import type { Mode, Page } from "./page.ts";

export interface StripPart {
  setMode(m: Mode): void;
}

const MODES: { m: Mode; label: string; key: string; says: string }[] = [
  { m: "select", label: "Select", key: "1", says: "A click selects just what you click." },
  { m: "uses", label: "Uses", key: "2", says: "A click selects what you click and everything it uses." },
  { m: "used", label: "Used by", key: "3", says: "A click selects what you click and everything that uses it." },
];

export function stripPart(page: Page): StripPart {
  const tabs = $("#tabs");
  const views = [
    { id: "board", title: "Board" },
    { id: "algebra", title: "Algebra review" },
    { id: "draft", title: "Draft", loose: true },
  ];
  const drawTabs = () => {
    tabs.innerHTML = String(html`${views.map(
      (v) => html`<button class="vk-tab" role="tab" data-view="${v.id}" aria-selected="${page.tab === v.id}">
        <span class="vk-tab-t"${v.loose ? html` style="font-style:italic"` : ""}>${v.title}</span>${v.id === "board" ? "" : html`<span class="vk-tab-x" data-x="${v.id}" aria-label="Close">×</span>`}</button>`,
    )}`);
  };
  tabs.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const x = t.closest<HTMLElement>("[data-x]")?.dataset.x;
    if (x) {
      views.splice(views.findIndex((v) => v.id === x), 1);
      if (page.tab === x) page.tab = "board";
      return drawTabs();
    }
    const v = t.closest<HTMLElement>("[data-view]")?.dataset.view;
    if (v) {
      page.tab = v;
      drawTabs();
    }
  });
  drawTabs();

  const modes = $("#modes");
  modes.innerHTML = String(html`${MODES.map((d) => html`<button data-mode="${d.m}" role="radio" aria-checked="${d.m === page.mode}">${d.label}</button>`)}`);
  for (const d of MODES) hint(modes.querySelector<HTMLElement>(`[data-mode="${d.m}"]`)!, () => html`<b>${d.label}</b> <span class="vk-muted">· key ${d.key}</span><div>${d.says}</div>`);
  const setMode = (m: Mode) => {
    page.mode = m;
    for (const b of modes.querySelectorAll<HTMLElement>("[data-mode]")) b.setAttribute("aria-checked", String(b.dataset.mode === m));
    page.refresh();
  };
  modes.addEventListener("click", (e) => {
    const m = (e.target as HTMLElement).closest<HTMLElement>("[data-mode]")?.dataset.mode as Mode | undefined;
    if (m) setMode(m);
  });

  return { setMode };
}

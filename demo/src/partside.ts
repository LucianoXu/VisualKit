// The side panel: the board as a tree, a folding section per group, a row per thing; the reader's
// folds kept in this browser. Drawn from the page's state, the keyboard's place kept.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, html, keepFocus } from "../../src/ts/index.ts";
import { KIND_COLOUR, lit } from "./page.ts";
import type { Page } from "./page.ts";

export interface SidePart {
  drawSide(): void;
}

export function sidePart(page: Page): SidePart {
  const body = $("#side-body");
  $("#side-n").textContent = String(page.items.length);
  const groups = [...new Set(page.items.map((it) => it.group))];

  const drawSide = () =>
    keepFocus(body, () => {
      const folded = new Set(page.folded.get());
      const on = lit(page);
      body.innerHTML = String(html`${groups.map((g) => {
        const members = page.items.filter((it) => it.group === g);
        const n = members.filter((it) => on.has(it.id)).length;
        // aria-expanded is the fold's whole state: a boolean as the whole value is written as the
        // word (dom.ts, html), and css/surfaces.css hides the body of a "false" one
        return html`<div class="vk-sec">
          <button class="vk-sec-h" data-group="${g}" aria-expanded="${!folded.has(g)}">${g}<span class="vk-sec-aside">${n ? `${n} lit` : members.length}</span></button>
          <div class="vk-sec-body tree">${members.map(
            (it) => html`<button class="vk-row${it.id === page.selected ? " on" : ""}" data-id="${it.id}" style="--c: var(${KIND_COLOUR[it.kind]})">
              <i></i><span class="vk-row-l">${it.name}</span>${it.status === "ok" ? "" : html`<span class="vk-dot ${it.status}" title="${it.status}"></span>`}</button>`,
          )}</div></div>`;
      })}`);
    });

  body.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const g = t.closest<HTMLElement>("[data-group]")?.dataset.group;
    if (g) {
      const f = new Set(page.folded.get());
      if (f.has(g)) f.delete(g);
      else f.add(g);
      page.folded.set([...f]);
      return drawSide();
    }
    const id = t.closest<HTMLElement>("[data-id]")?.dataset.id;
    if (id) page.select(id === page.selected ? null : id);
  });

  return { drawSide };
}

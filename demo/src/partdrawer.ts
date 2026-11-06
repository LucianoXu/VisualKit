// The drawer: the thing selected, told in full — its kind, its name in the gradient, its numbers,
// what it uses, its note in light Markdown, and what can be done with it. Drawn again on every live
// tick: held while the reader presses in it (holdPress), its open sections kept on the page.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, Drawer, html, holdPress, icon, keepFocus, markdown, raw, confirm, ask } from "../../src/ts/index.ts";
import { KIND_COLOUR } from "./page.ts";
import type { Page } from "./page.ts";

export interface DrawerPart {
  drawer: Drawer;
  drawDrawer(): void;
}

export function drawerPart(page: Page): DrawerPart {
  const el = $("#drawer");
  const drawer = new Drawer(el, { changed: (open) => !open && page.selected && page.select(null) });

  const drawBody = holdPress(el, () => {
    const it = page.selected ? page.byId.get(page.selected) : null;
    if (!it) return;
    const usedBy = page.items.filter((o) => o.uses.includes(it.id));
    keepFocus(el, () => {
      el.innerHTML = String(html`
        <div class="vk-drawer-head">
          <span class="vk-drawer-kicker"><span class="vk-dot" style="background: var(${KIND_COLOUR[it.kind]})"></span>${it.kind} · ${it.group}</span>
          <button class="vk-icon round" data-close aria-label="Close" title="Close (Esc)">${raw(icon("close", 12))}</button>
        </div>
        <div class="vk-title">${it.name}</div>
        <div class="vk-soft vk-mono" style="font-size:12px;margin-bottom:12px">${it.id}</div>
        ${it.status === "failed" ? html`<div class="vk-banner bad" style="margin-bottom:12px">This failed to build: what rests on it is not checked.</div>` : ""}
        ${it.status === "attention" ? html`<div class="vk-banner warn" style="margin-bottom:12px">It has changed since it was last reviewed.</div>` : ""}
        <div class="vk-stats">
          <div class="vk-stat"><div class="vk-stat-n">${it.uses.length}</div><div class="vk-stat-l">it uses</div></div>
          <div class="vk-stat" style="--g: var(--grad-cool)"><div class="vk-stat-n">${usedBy.length}</div><div class="vk-stat-l">use it</div></div>
          <div class="vk-stat" style="--g: var(--grad-warm)"><div class="vk-stat-n">${it.name.length}</div><div class="vk-stat-l">letters</div></div>
        </div>
        <div class="vk-md" style="margin-bottom:12px">${raw(markdown(it.note))}</div>
        <pre class="vk-code"><span class="tk-keyword">theorem</span> <span class="tk-type">${it.name}</span> : <span class="tk-type">Prop</span> := <span class="tk-keyword">by</span>
  <span class="tk-comment">-- ${it.uses.length} steps</span>
  exact <span class="tk-number">0</span></pre>
        <div class="vk-sec"><button class="vk-sec-h" aria-expanded="${page.unfolded.has("uses")}" data-sec="uses">Uses<span class="vk-sec-aside">${it.uses.length}</span></button>
          <div class="vk-sec-body">${it.uses.length ? it.uses.map((u) => html`<button class="vk-row" data-go="${u}"><span class="vk-row-l vk-mono">${u}</span></button>`) : html`<div class="vk-muted">Nothing.</div>`}</div></div>
        <div class="vk-sec"><button class="vk-sec-h" aria-expanded="${page.unfolded.has("diff")}" data-sec="diff">Changes<span class="vk-sec-aside">+1 −1</span></button>
          <div class="vk-sec-body"><div class="vk-diff"><div class="del">  exact one</div><div class="add">  exact 0</div></div></div></div>
        <div class="vk-actions" style="justify-content:flex-start;margin-top:14px">
          <button class="vk-btn ok" data-act="approve">Approve</button>
          <button class="vk-btn info" data-act="comment">Comment</button>
          <button class="vk-btn" data-act="window">${raw(icon("pin", 13))}Open in a window</button>
          <button class="vk-btn bad" data-act="remove">Remove</button>
        </div>`);
    });
  });
  const drawDrawer = () => {
    drawer.toggle(!!page.selected);
    drawBody();
  };

  el.addEventListener("click", async (e) => {
    const t = e.target as HTMLElement;
    const sec = t.closest<HTMLElement>("[data-sec]");
    if (sec) {
      const s = sec.dataset.sec!;
      if (!page.unfolded.delete(s)) page.unfolded.add(s);
      return drawBody();
    }
    const go = t.closest<HTMLElement>("[data-go]")?.dataset.go;
    if (go) return page.select(go);
    const act = t.closest<HTMLElement>("[data-act]")?.dataset.act;
    const it = page.selected ? page.byId.get(page.selected) : null;
    if (!act || !it) return;
    if (act === "window") page.openNote(it.id);
    else if (act === "comment") {
      const said = await ask({ title: `Comment on ${it.name}`, ok: "Comment", placeholder: "What should change?" });
      if (said) it.note += `\n\n> ${said}`;
      drawDrawer();
    } else if (act === "remove") {
      if (await confirm({ title: `Remove ${it.name}?`, text: "It leaves this board; the others keep it.", ok: "Remove", bad: true })) page.select(null);
    } else if (act === "approve") {
      it.status = "ok";
      page.refresh();
    }
  });

  return { drawer, drawDrawer };
}

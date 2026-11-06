// The bar: back and forward, the board's name and state; at the right the search, Share, the view's
// settings behind an icon, and Activity with its count.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, html, icon, Popover, themeChoices, keepFocus, raw } from "../../src/ts/index.ts";
import type { Page } from "./page.ts";

export interface BarPart {
  /** back and forward as the history allows */
  syncNav(): void;
  /** go back (-1) or forward (+1) */
  step(d: -1 | 1): void;
  /** the search, focused */
  search: HTMLInputElement;
  /** whether the board's names are drawn: the view settings' switch */
  shareExact: boolean;
}

export function barPart(page: Page): BarPart {
  const back = $<HTMLButtonElement>("#nav-back");
  const fwd = $<HTMLButtonElement>("#nav-fwd");
  back.innerHTML = icon("back", 16);
  fwd.innerHTML = icon("forward", 16);

  const step = (d: -1 | 1) => {
    const to = page.at + d;
    if (to < 0 || to >= page.history.length) return;
    page.at = to;
    page.select(page.history[to], false);
    page.syncNav();
  };
  back.addEventListener("click", () => step(-1));
  fwd.addEventListener("click", () => step(1));

  // ---------------------------------------------------------------- Share
  const shareBtn = $("#share-btn");
  shareBtn.innerHTML = icon("share") + "<span>Share</span>";
  const sharePop = $("#share-pop");
  let shareTab: "link" | "agent" = "link";
  const bar: BarPart = {
    syncNav() {
      back.disabled = page.at <= 0;
      fwd.disabled = page.at >= page.history.length - 1;
    },
    step,
    search: $<HTMLInputElement>("#search"),
    shareExact: true,
  };
  const drawShare = () =>
    keepFocus(sharePop, () => {
      const url = `${location.origin}/board${page.selected ? `#${encodeURIComponent(page.selected)}` : ""}`;
      sharePop.innerHTML = String(html`
        <div class="vk-seg fill small" role="tablist">
          <button data-tab="link" role="tab" aria-selected="${shareTab === "link"}">Link</button>
          <button data-tab="agent" role="tab" aria-selected="${shareTab === "agent"}">Agent</button>
        </div>
        ${shareTab === "link"
          ? html`<div class="vk-pop-h">A link to this view</div>
            <input class="vk-input mono" readonly value="${url}" aria-label="The link">
            <button class="vk-switch" role="switch" data-exact aria-checked="${bar.shareExact}"><i></i>Exactly what I see</button>
            <div class="vk-hint">With it on, the link carries the selection and the windows; off, only the board.</div>
            <div class="vk-actions"><button class="vk-btn primary" data-copy>Copy link</button></div>`
          : html`<div class="vk-pop-h">A prompt for an agent</div>
            <div class="vk-form"><label for="agent-name">Name</label><input id="agent-name" class="vk-input" value="Reviewer">
            <label for="agent-level">May</label><select id="agent-level" class="vk-select"><option>read</option><option>comment</option></select></div>
            <div class="vk-banner info">The agent gets a token of its own; revoke it here at any time.</div>
            <div class="vk-actions"><button class="vk-btn soft" data-copy>Copy prompt</button></div>`}
      `);
    });
  new Popover(shareBtn, sharePop, { changed: (open) => open && drawShare() });
  sharePop.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const tab = t.closest<HTMLElement>("[data-tab]")?.dataset.tab;
    if (tab) {
      shareTab = tab as typeof shareTab;
      drawShare();
    } else if (t.closest("[data-exact]")) {
      bar.shareExact = !bar.shareExact;
      drawShare();
    } else if (t.closest("[data-copy]")) {
      const b = t.closest<HTMLButtonElement>("[data-copy]")!;
      b.textContent = "Copied ✓";
      setTimeout(drawShare, 1200);
    }
  });

  // ---------------------------------------------------------------- the view's settings
  const eyesBtn = $("#eyes-btn");
  eyesBtn.innerHTML = icon("settings");
  const eyesPop = $("#eyes-pop");
  eyesPop.style.width = "260px";
  eyesPop.innerHTML = String(html`
    <div class="vk-overline">Theme</div>
    <div class="vk-seg" id="theme-seg"></div>
    <div class="vk-pop-sep"></div>
    <div class="vk-overline">Look</div>
    <button class="vk-switch" role="switch" aria-checked="true" data-flip>Names on hover</button>
    <button class="vk-switch" role="switch" aria-checked="false" data-flip>Reduced labels</button>
    <div class="vk-hint">The theme follows ${raw("<kbd>t</kbd>")} too.</div>
  `);
  themeChoices($("#theme-seg"));
  eyesPop.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-flip]");
    if (b) b.setAttribute("aria-checked", String(b.getAttribute("aria-checked") !== "true"));
  });
  new Popover(eyesBtn, eyesPop);

  // ---------------------------------------------------------------- Activity
  const act = $("#activity-btn");
  act.insertAdjacentHTML("afterbegin", icon("activity"));
  act.addEventListener("click", () => {
    act.querySelector(".vk-badge")?.remove();
    page.openActivity();
  });

  // ---------------------------------------------------------------- the search
  const results = $("#results");
  const search = bar.search;
  const showResults = () => {
    const q = search.value.trim().toLowerCase();
    if (!q) return void (results.hidden = true);
    const found = page.items.filter((it) => it.id.toLowerCase().includes(q)).slice(0, 12);
    const mark = (s: string) => {
      const k = s.toLowerCase().indexOf(q);
      return k < 0 ? html`${s}` : html`${s.slice(0, k)}<mark>${s.slice(k, k + q.length)}</mark>${s.slice(k + q.length)}`;
    };
    results.innerHTML = found.length
      ? String(html`${found.map((it) => html`<button class="vk-row" data-id="${it.id}"><span class="vk-row-l">${mark(it.id)}</span><span class="vk-row-r">${it.kind}</span></button>`)}`)
      : `<div class="vk-row vk-muted">Nothing is called that.</div>`;
    results.hidden = false;
  };
  search.addEventListener("input", showResults);
  search.addEventListener("focus", showResults);
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      search.value = "";
      results.hidden = true;
      search.blur();
    } else if (e.key === "Enter") results.querySelector<HTMLElement>("[data-id]")?.click();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      results.querySelector<HTMLElement>("[data-id]")?.focus();
    }
  });
  results.addEventListener("click", (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-id]")?.dataset.id;
    if (!id) return;
    results.hidden = true;
    search.value = "";
    search.blur();
    page.select(id);
  });
  document.addEventListener("pointerdown", (e) => {
    if (!(e.target as Element).closest(".vk-popwrap")) results.hidden = true;
  });

  return bar;
}

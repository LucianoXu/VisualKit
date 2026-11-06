// The context menu: the page takes over the right click on what it draws (and the ContextMenu key or
// Shift+F10 on what is selected), and offers what can be done with what it was opened on. What the
// reader cannot do there is left out, not greyed: build the items for the place and the reader.
//
// One menu at a time, a submenu beside it, kept inside the window. The pointer or the keys drive it
// (arrows, Home, End, Enter; → opens a submenu, ← goes back; Esc closes); a press elsewhere closes
// it without doing anything. While it is open the keys are its own: none reaches the page's
// shortcuts.
//
//   const menu = new ContextMenu();
//   contextMenuOn($("#canvas"), (at) => ({ heading: "Canvas", items: [{ label: "Fit to screen", key: "f", run: fit }] }));

import { escapeHtml } from "./dom.ts";

export interface MenuItem {
  label: string;
  /** what it does; the menu closes first */
  run?: () => void;
  /** its shortcut, shown at the right */
  key?: string;
  /** a word at the right where there is no shortcut */
  note?: string;
  disabled?: boolean;
  /** a line above it */
  sep?: boolean;
  /** it removes or revokes */
  bad?: boolean;
  /** a submenu, opened beside it */
  sub?: MenuItem[];
}

export class ContextMenu {
  readonly el: HTMLElement;
  private items: MenuItem[] = [];
  private subEl: HTMLElement | null = null;
  private closedHook: () => void = () => {};

  constructor(el?: HTMLElement) {
    if (!el) {
      el = document.createElement("div");
      el.className = "vk-menu";
      el.hidden = true;
      document.body.append(el);
    }
    this.el = el;
    el.setAttribute("role", "menu");
    el.tabIndex = -1;
    el.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-k]");
      if (b && !b.disabled) this.choose(b);
    });
    el.addEventListener("pointerover", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-k]");
      if (!b) return;
      // resting on a line that opens beside it opens it; on another line of the same menu, the one
      // open goes
      if (this.itemOf(b)?.sub) this.openSub(b);
      else if (!this.subEl?.contains(b)) this.closeSub();
      b.focus({ preventScroll: true });
    });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (this.open && !el.contains(e.target as Node)) this.close();
      },
      true,
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (!this.open) return;
        e.stopImmediatePropagation();
        this.key(e);
      },
      true,
    );
    window.addEventListener("blur", () => this.close());
    window.addEventListener("resize", () => this.close());
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  /** Called whenever the menu closes, chosen or not. */
  onClose(f: () => void): void {
    this.closedHook = f;
  }

  /** Open at a point of the window; `keys`: opened from the keyboard, the first item takes the
   *  focus. */
  show(items: MenuItem[], x: number, y: number, heading?: string, keys = false): void {
    this.items = items;
    this.closeSub();
    this.el.innerHTML = (heading ? `<div class="vk-menu-h">${escapeHtml(heading)}</div>` : "") + this.list(items, "");
    this.el.hidden = false;
    place(this.el, x, y);
    const first = this.el.querySelector<HTMLElement>("button[data-k]:not(:disabled)");
    if (keys && first) first.focus();
    else this.el.focus({ preventScroll: true });
  }

  close(): void {
    if (!this.open) return;
    this.closeSub();
    this.el.hidden = true;
    this.el.innerHTML = "";
    this.closedHook();
  }

  private list(items: MenuItem[], path: string): string {
    return items
      .map(
        (it, k) =>
          (it.sep && k > 0 ? `<div class="vk-menu-sep" role="separator"></div>` : "") +
          `<button type="button" class="vk-menu-item${it.bad ? " bad" : ""}" role="menuitem" data-k="${path}${k}"${it.disabled ? " disabled" : ""}${it.sub ? ` aria-haspopup="menu" aria-expanded="false"` : ""}>` +
          `<span class="vk-menu-l">${escapeHtml(it.label)}</span>` +
          (it.sub
            ? `<span class="vk-menu-more" aria-hidden="true">▸</span>`
            : it.key
              ? `<span class="vk-menu-key">${escapeHtml(it.key)}</span>`
              : it.note
                ? `<span class="vk-menu-note">${escapeHtml(it.note)}</span>`
                : "") +
          `</button>`,
      )
      .join("");
  }

  private itemOf(b: HTMLElement): MenuItem | undefined {
    const path = b.dataset.k!.split(".").map(Number);
    let it: MenuItem | undefined = this.items[path[0]];
    for (const k of path.slice(1)) it = it?.sub?.[k];
    return it;
  }

  private choose(b: HTMLButtonElement): void {
    const it = this.itemOf(b);
    if (!it) return;
    if (it.sub) return this.openSub(b, true);
    this.close();
    it.run?.();
  }

  private openSub(b: HTMLButtonElement, focus = false): void {
    const it = this.itemOf(b);
    if (!it?.sub) return;
    if (this.subEl && this.subEl.dataset.of === b.dataset.k) {
      if (focus) this.subEl.querySelector<HTMLElement>("button[data-k]:not(:disabled)")?.focus();
      return;
    }
    this.closeSub();
    const sub = document.createElement("div");
    sub.className = "vk-menu-sub";
    sub.setAttribute("role", "menu");
    sub.dataset.of = b.dataset.k;
    sub.innerHTML = this.list(it.sub, `${b.dataset.k}.`);
    this.el.append(sub);
    this.subEl = sub;
    b.setAttribute("aria-expanded", "true");
    // beside its line, on the right where there is room, else on the left; inside the window
    const r = b.getBoundingClientRect();
    const w = sub.offsetWidth, h = sub.offsetHeight;
    const x = r.right + 2 + w <= innerWidth - 8 ? r.right + 2 : Math.max(8, r.left - 2 - w);
    const y = Math.max(8, Math.min(r.top - 5, innerHeight - h - 8));
    const box = this.el.getBoundingClientRect();
    sub.style.left = `${Math.round(x - box.left)}px`;
    sub.style.top = `${Math.round(y - box.top)}px`;
    if (focus) sub.querySelector<HTMLElement>("button[data-k]:not(:disabled)")?.focus();
  }

  private closeSub(): void {
    if (!this.subEl) return;
    this.el.querySelector(`button[data-k="${this.subEl.dataset.of}"]`)?.setAttribute("aria-expanded", "false");
    this.subEl.remove();
    this.subEl = null;
  }

  private key(e: KeyboardEvent): void {
    const here = document.activeElement as HTMLElement | null;
    const inSub = !!this.subEl && !!here && this.subEl.contains(here);
    const back = () => {
      const of = this.subEl!.dataset.of!;
      this.closeSub();
      this.el.querySelector<HTMLElement>(`button[data-k="${of}"]`)?.focus();
    };
    if (e.key === "Escape") {
      e.preventDefault();
      // out of a submenu first, then the menu
      if (inSub) back();
      else this.close();
      return;
    }
    const scope = inSub ? this.subEl! : this.el;
    const buttons = [...scope.querySelectorAll<HTMLButtonElement>(":scope > button[data-k]:not(:disabled)")];
    const at = here ? buttons.indexOf(here as HTMLButtonElement) : -1;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (!buttons.length) return;
      const n = buttons.length;
      const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : at < 0 ? (e.key === "ArrowDown" ? 0 : n - 1) : (at + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
      buttons[next].focus();
      if (!inSub) this.closeSub();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (!inSub && at >= 0 && this.itemOf(buttons[at])?.sub) this.openSub(buttons[at], true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (inSub) back();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (at >= 0) this.choose(buttons[at]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      this.close();
    }
  }
}

/** Put `el` at (x, y), inside the window: moved left or up by what would stick out. */
function place(el: HTMLElement, x: number, y: number): void {
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = `${Math.round(Math.max(8, Math.min(x, innerWidth - w - 8)))}px`;
  el.style.top = `${Math.round(Math.max(8, Math.min(y, innerHeight - h - 8)))}px`;
}

/** What the menu offers where it was opened: nothing (null) leaves the browser's own menu. */
export type MenuFor = (at: { x: number; y: number; target: Element; keys: boolean }) => { items: MenuItem[]; heading?: string } | null;

/** Open `menu` on a right click in `area`, and on the ContextMenu key or Shift+F10 with the focus in
 *  it (at the focused element's corner). */
export function contextMenuOn(area: HTMLElement, menu: ContextMenu, build: MenuFor): void {
  const open = (x: number, y: number, target: Element, keys: boolean, e: Event) => {
    const m = build({ x, y, target, keys });
    if (!m || !m.items.length) return;
    e.preventDefault();
    menu.show(m.items, x, y, m.heading, keys);
  };
  area.addEventListener("contextmenu", (e) => open(e.clientX, e.clientY, e.target as Element, false, e));
  area.addEventListener("keydown", (e) => {
    if (e.key !== "ContextMenu" && !(e.key === "F10" && e.shiftKey)) return;
    const t = (document.activeElement as HTMLElement | null) ?? area;
    const r = t.getBoundingClientRect();
    open(r.left + 8, r.bottom - 4, t, true, e);
  });
}

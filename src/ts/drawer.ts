// The drawer: what is selected, told in full, slid in from the right (on a phone, a sheet from the
// bottom; css/surfaces.css). It opens when something is selected and closes when nothing is; Esc
// closes it with the focus in it, and the focus goes back where it came from.
//
// The page tells the content under it how much room the panels take (`--inset-left`,
// `--inset-right` on <html>), so that what is centred on the content — a strip, a camera's fit — is
// centred on what is still seen.

import { focusBack } from "./focus.ts";

export class Drawer {
  readonly el: HTMLElement;
  private from: HTMLElement | null = null;
  private changed: (open: boolean) => void;

  constructor(el: HTMLElement, o: { changed?: (open: boolean) => void } = {}) {
    this.el = el;
    this.changed = o.changed ?? (() => {});
    el.setAttribute("aria-hidden", String(!this.open));
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      this.toggle(false);
    });
    el.addEventListener("click", (e) => {
      if ((e.target as Element).closest("[data-close]")) this.toggle(false);
    });
    insets();
  }

  get open(): boolean {
    return this.el.classList.contains("open");
  }

  toggle(open = !this.open): void {
    if (open === this.open) return;
    if (open) this.from = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    else focusBack(this.el, this.from);
    this.el.classList.toggle("open", open);
    this.el.setAttribute("aria-hidden", String(!open));
    // closed, nothing in it is reached by Tab
    this.el.inert = !open;
    insets();
    this.changed(open);
  }
}

/** Say on <html> how much of the viewport's width the side panel and an open drawer cover
 *  (`--inset-left`, `--inset-right`), and whether a side panel is shown (`data-side`: shown, none).
 *  Call it when a panel comes or goes by other means than the Drawer. */
export function insets(): void {
  const root = document.documentElement;
  const vw = root.clientWidth;
  const side = document.querySelector<HTMLElement>(".vk-side");
  const drawer = document.querySelector<HTMLElement>(".vk-drawer.open");
  // shown or not (a fixed element has no offsetParent either way): a hidden one has no box
  const sr = side && side.getClientRects().length ? side.getBoundingClientRect() : null;
  const left = sr && sr.width ? sr.right : 0;
  let right = 0;
  if (drawer) {
    // read where it will rest, not where its slide is now
    const style = getComputedStyle(drawer);
    const w = parseFloat(style.width) || 0;
    const r = parseFloat(style.right) || 0;
    if (style.top !== "auto" && w < vw) right = w + r;
  }
  // whether a side panel is shown at all, for what would meet it (css/surfaces.css, the player)
  root.dataset.side = left ? "shown" : "none";
  root.style.setProperty("--inset-left", `${Math.round(left)}px`);
  root.style.setProperty("--inset-right", `${Math.round(right)}px`);
}
if (typeof window !== "undefined") window.addEventListener("resize", insets);

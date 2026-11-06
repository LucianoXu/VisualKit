// A popover: a small panel that opens from a button and goes away on a press anywhere else, on Esc,
// or on the button again. Keep the less used controls in them, and the page stays simple: a setting
// is one press away, never on show.
//
// From the keyboard it is a place of its own: opened by Enter or Space on its button, the focus goes
// into it, as it may be far from its button in the page's order; closed with the focus in it, the
// focus goes back to its button.
//
//   <div class="vk-popwrap">
//     <button class="vk-act" id="share-btn" aria-haspopup="dialog" aria-expanded="false">Share</button>
//     <div class="vk-popover" id="share-pop" role="dialog" aria-label="Share" hidden>…</div>
//   </div>
//   const share = new Popover($("#share-btn"), $("#share-pop"), { changed: (open) => open && draw() });

import { firstControl, focusBack } from "./focus.ts";

export interface PopoverOptions {
  /** put the panel where it goes, once it is shown (it has a size then); none: CSS places it */
  place?: () => void;
  /** what a press may land on without closing it (another window it opened), as selectors */
  keep?: string;
  /** told when it opens (to draw what it holds) or closes */
  changed?: (open: boolean) => void;
}

export class Popover {
  readonly btn: HTMLElement;
  readonly el: HTMLElement;
  private o: PopoverOptions;

  constructor(btn: HTMLElement, el: HTMLElement, o: PopoverOptions = {}) {
    this.btn = btn;
    this.el = el;
    this.o = o;
    btn.setAttribute("aria-expanded", String(!el.hidden));
    btn.addEventListener("click", (e) => {
      this.toggle();
      // a click from the keyboard (no pointer pressed it): its first control takes the focus
      if (this.open && e.detail === 0) firstControl(this.el)?.focus();
    });
    document.addEventListener("pointerdown", (e) => {
      const t = e.target as Element | null;
      if (this.el.hidden || !t || this.el.contains(t) || this.btn.contains(t) || (o.keep && t.closest?.(o.keep))) return;
      this.toggle(false);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      this.toggle(false);
    });
    window.addEventListener("resize", () => {
      if (!this.el.hidden) this.o.place?.();
    });
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  toggle(open = this.el.hidden): void {
    if (open === !this.el.hidden) return;
    if (!open) focusBack(this.el, this.btn);
    this.el.hidden = !open;
    this.btn.classList.toggle("on", open);
    this.btn.setAttribute("aria-expanded", String(open));
    this.o.changed?.(open);
    if (open) this.o.place?.();
  }
}

/** A `.vk-popover.fixed` put beside `anchor` (a side panel, a button), level with `btn`, inside the
 *  window; what does not fit below scrolls. */
export function beside(anchor: HTMLElement, btn: HTMLElement, el: HTMLElement, minTop = 66): void {
  const side = anchor.getBoundingClientRect();
  const at = btn.getBoundingClientRect();
  const left = side.width ? side.right + 8 : at.left;
  const top = Math.max(minTop, Math.min(at.top - 6, innerHeight - el.offsetHeight - 12, innerHeight - 240));
  el.style.left = `${Math.round(Math.max(12, Math.min(left, innerWidth - el.offsetWidth - 12)))}px`;
  el.style.top = `${Math.round(top)}px`;
  el.style.maxHeight = `${Math.round(innerHeight - top - 12)}px`;
}

// Hints: what a control does, said under it while the pointer is on it or it has the focus — and
// nowhere else, so that the reader who knows the page is not told again. A title attribute is
// enough for most buttons; a hint card is for a control whose name does not say what it does (a
// mode, a tool): its name in bold, its key, a sentence.
//
//   hint($("#mode-tcb"), () => html`<b>TCB</b> <span class="vk-muted">· key 2</span><div>What its statement rests on.</div>`);

import type { SafeHtml } from "./dom.ts";

let card: HTMLElement | null = null;

function cardEl(): HTMLElement {
  if (!card) {
    card = document.createElement("div");
    card.className = "vk-hintcard";
    card.setAttribute("role", "tooltip");
    card.hidden = true;
    document.body.append(card);
  }
  return card;
}

/** Show `content` under `el` while the pointer is on it or it has the focus. */
export function hint(el: HTMLElement, content: () => SafeHtml | string): void {
  const show = () => {
    const c = cardEl();
    c.innerHTML = String(content());
    c.hidden = false;
    const r = el.getBoundingClientRect();
    const below = r.bottom + 8 + c.offsetHeight <= innerHeight - 8;
    c.style.top = `${Math.round(below ? r.bottom + 8 : r.top - 8 - c.offsetHeight)}px`;
    c.style.left = `${Math.round(Math.max(8, Math.min(innerWidth - c.offsetWidth - 8, r.left + r.width / 2 - c.offsetWidth / 2)))}px`;
  };
  const hide = () => {
    if (card) card.hidden = true;
  };
  el.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") show();
  });
  el.addEventListener("pointerleave", hide);
  el.addEventListener("focus", () => {
    if (el.matches(":focus-visible")) show();
  });
  el.addEventListener("blur", hide);
  el.addEventListener("click", hide);
}

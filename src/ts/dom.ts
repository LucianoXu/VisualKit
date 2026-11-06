// Small helpers every part uses: finding elements, writing HTML from text safely, growing a text box.
//
// The kit draws with HTML strings and `innerHTML`, as VisualProof does: a part renders a whole
// region from its state, and keeps the keyboard's place across the redraw (focus.ts, keepFocus).
// Everything written into such a string that came from data goes through `escapeHtml` (or the
// `html` tag, which does it for every value).

/** The element `sel` finds, which the page is known to hold. */
export const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`VisualKit: no element matches ${sel}`);
  return el;
};

/** Every element `sel` finds, as an array. */
export const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T[] => [...root.querySelectorAll<T>(sel)];

/** Text made safe to write inside HTML, in content and in a quoted attribute. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** HTML that is already safe: what `html` returns, and what it writes as it is. */
export class SafeHtml {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

/** Mark a string as safe HTML (an icon, markup the code itself wrote). */
export const raw = (s: string): SafeHtml => new SafeHtml(s);

/** A template tag: every value is escaped unless it is SafeHtml; arrays are joined; null,
 *  undefined and false write nothing.
 *
 *    el.innerHTML = String(html`<b>${name}</b>${items.map((i) => html`<li>${i}</li>`)}`); */
export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  const one = (v: unknown): string =>
    v === null || v === undefined || v === false ? "" : v instanceof SafeHtml ? v.value : Array.isArray(v) ? v.map(one).join("") : escapeHtml(String(v));
  let out = strings[0];
  values.forEach((v, k) => (out += one(v) + strings[k + 1]));
  return new SafeHtml(out);
}

/** A text box as tall as what is written in it, between its CSS min and max heights. */
export function fitBox(box: HTMLTextAreaElement): void {
  box.style.height = "auto";
  box.style.height = `${box.scrollHeight + 2}px`;
}

/** The viewport's size, without the scrollbars. */
export const viewport = (): { w: number; h: number } => ({
  w: document.documentElement.clientWidth || innerWidth,
  h: document.documentElement.clientHeight || innerHeight,
});

/** Whether the focus is in a field, where the page's single-key shortcuts must not fire. */
export function typing(e: Event): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

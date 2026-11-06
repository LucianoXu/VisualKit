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
 *  undefined and false write nothing — except as the whole value of an `aria-*` attribute.
 *
 *    el.innerHTML = String(html`<b>${name}</b>${items.map((i) => html`<li>${i}</li>`)}`);
 *    html`<button aria-expanded="${open}">`       // aria-expanded="false" when closed
 *    html`${open && html`<div>…</div>`}`          // nothing when closed
 *    html`<li class="row ${on && "on"}">`         // nothing when off
 *    html`<button${off && raw(" disabled")}>`     // a boolean attribute: there, or not written
 *
 *  Where a value lands is read from the markup around it:
 *  - in content, it is escaped text;
 *  - as the whole quoted value of an `aria-*` attribute, a boolean is the word `true` or `false`:
 *    those attributes are strings that name a state, and `aria-expanded=""` is neither, so no
 *    `[aria-expanded="false"]` rule would match. Every other attribute keeps the rule above;
 *  - HTML's own boolean attributes (`hidden`, `disabled`, `checked`) are on by being there at all,
 *    `disabled="false"` included: write them or leave them out, never `disabled="${b}"`;
 *  - an unquoted value (`title=${t}`) is quoted, so that a space in it cannot start another
 *    attribute; quote the attribute yourself where values or text are joined in it;
 *  - in a tag but not in a value, SafeHtml is written as it is (`<span${extra}>`, `extra` an
 *    attribute the code wrote); anything else cannot name an attribute: its spaces, `=`, `/` and
 *    backticks are written as character references. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0];
  let at = scan(strings[0], "text");
  values.forEach((v, k) => {
    const before = strings[k], after = strings[k + 1];
    let w: string;
    if (at === "text") w = one(v);
    else if (at === "tag") {
      if (/=\s*$/.test(before)) w = `"${typeof v === "boolean" && ARIA.test(before) ? String(v) : one(v)}"`;
      else w = inTag(v);
    } else w = typeof v === "boolean" && ARIA.test(before) && after.startsWith(at) ? String(v) : one(v);
    out += w + after;
    at = scan(w + after, at);
  });
  return new SafeHtml(out);
}

/** a value written as it is (SafeHtml), as escaped text, or as nothing */
function one(v: unknown): string {
  return v === null || v === undefined || v === false ? "" : v instanceof SafeHtml ? v.value : Array.isArray(v) ? v.map(one).join("") : escapeHtml(String(v));
}

/** in a tag, outside a value: what is not SafeHtml cannot start an attribute or end the tag */
function inTag(v: unknown): string {
  if (v === null || v === undefined || v === false) return "";
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(inTag).join("");
  return escapeHtml(String(v)).replace(/[\s=/`]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** the static text before a value ends with `aria-name=` and maybe its opening quote */
const ARIA = /\saria-[\w-]+\s*=\s*["']?$/i;

/** Where the markup written so far leaves the next value: in content, in a tag, or in a quoted
 *  value (its quote). Escaped text holds no `<`, `>` or quote, so only the code's own markup moves
 *  it. Enough for the markup a part writes; not a parser (comments and <script> are not read). */
type At = "text" | "tag" | '"' | "'";
function scan(s: string, at: At): At {
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (at === "text") {
      if (c === "<" && /[a-z/]/i.test(s[i + 1] ?? "")) at = "tag";
    } else if (at === "tag") {
      if (c === '"' || c === "'") at = c;
      else if (c === ">") at = "text";
    } else if (c === at) at = "tag";
  }
  return at;
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

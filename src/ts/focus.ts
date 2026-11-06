// The keyboard's place, kept.
//
// A region drawn anew from its HTML replaces the element that had the focus: the focus would fall to
// the page's start, and a reader at the keyboard would have to come all the way back after each
// press. `keepFocus` finds what had it again in what is drawn, by what it is — its tag and data
// attributes (or its first class), and the data attributes of what holds it — and focuses it there.
// So: give the controls of a redrawn region data attributes that say what they are for.
//
// A popover or window closing with the focus in it gives the focus back to the button that opened
// it (`focusBack`), not to the page's start.

/** An element as `focusKey` reads it (in tests, a stand-in). */
export interface KeyedEl {
  readonly tagName: string;
  readonly className: string;
  readonly attributes: ArrayLike<{ readonly name: string; readonly value: string }>;
  readonly parentElement: KeyedEl | null;
}

function dataOf(el: KeyedEl): string {
  const out: string[] = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (a.name.startsWith("data-")) out.push(`${a.name}=${a.value}`);
  }
  return out.sort().join(" ");
}

/** What `el` is inside `root`, the same for its like drawn again. */
export function focusKey(el: KeyedEl, root: KeyedEl): string {
  const data = dataOf(el);
  const own = `${el.tagName.toLowerCase()}${data ? `[${data}]` : `.${el.className.trim().split(/\s+/)[0] ?? ""}`}`;
  const up: string[] = [];
  for (let e = el.parentElement; e && e !== root; e = e.parentElement) {
    const d = dataOf(e);
    if (d) up.push(d);
  }
  return [own, ...up].join(" < ");
}

/** Draw `root` again with `draw`, the focus kept; where what had it is gone, `fallback` (a selector
 *  inside `root`) takes it. Nothing is focused where the focus was elsewhere. */
export function keepFocus(root: HTMLElement, draw: () => void, fallback?: string): void {
  const back = holdFocus(root, fallback);
  draw();
  back();
}

/** `keepFocus` in two halves, for a drawing that awaits: what has the focus in `root` now, and the
 *  function that focuses it again once `root` is drawn. */
export function holdFocus(root: HTMLElement, fallback?: string): () => void {
  if (typeof document === "undefined") return () => {};
  const a = document.activeElement;
  const had = a instanceof HTMLElement && a !== root && root.contains(a) ? a : null;
  const key = had ? focusKey(had, root) : null;
  return () => {
    if (!had || root.contains(had)) return;
    const like = [...root.querySelectorAll<HTMLElement>(had.tagName)].find((e) => focusKey(e, root) === key) ?? (fallback ? root.querySelector<HTMLElement>(fallback) : null);
    like?.focus({ preventScroll: true });
  };
}

/** `from` is closing with the focus in it: the focus goes to `to`. Elsewhere it is left be. */
export function focusBack(from: HTMLElement, to: HTMLElement | null): void {
  if (typeof document === "undefined") return;
  if (from.contains(document.activeElement)) to?.focus({ preventScroll: true });
}

/** The first control in `el` the keyboard can reach. */
export function firstControl(el: HTMLElement): HTMLElement | null {
  for (const c of el.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, summary, [tabindex]")) {
    if (c.tabIndex >= 0 && !c.matches(":disabled") && (typeof c.checkVisibility !== "function" || c.checkVisibility())) return c;
  }
  return null;
}

/** Keep Tab inside `el` (a modal): from its last control to its first, and back. Returns the
 *  function that lets it go. */
export function trapFocus(el: HTMLElement): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const all = [...el.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]")].filter((c) => c.tabIndex >= 0 && !c.matches(":disabled"));
    if (!all.length) return;
    const first = all[0], last = all[all.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  el.addEventListener("keydown", onKey);
  return () => el.removeEventListener("keydown", onKey);
}

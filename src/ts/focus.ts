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

/** Something `holdPress` listens on (in tests, stand-ins for an element, its document, its window). */
interface Listened {
  addEventListener(type: string, f: (e: Event) => void, capture?: boolean): void;
}
/** What `holdPress` listens on: an element, its document and the document's window. */
export interface PressRoot extends Listened {
  readonly ownerDocument: (Listened & { readonly defaultView: Listened | null; readonly visibilityState?: string }) | null;
}

/** A press in progress in one root. */
interface Hold {
  /** the pointers down, by id: released when the last is */
  pointers: Set<unknown>;
  /** Space down on a control */
  key: boolean;
  /** a draw was asked for under it */
  missed: boolean;
  draw: () => void;
  /** the cap: let go however the press goes on */
  cap: ReturnType<typeof setTimeout> | undefined;
  max: number;
}

/** the presses in progress: only these are known to the document's listeners, so a root that is
 *  not pressed is held by nothing here */
const holding = new Set<Hold>();
/** the documents whose listeners are on: one set for every root in them */
const listening = new WeakSet<object>();

function run(h: Hold): void {
  h.missed = false;
  h.draw();
}

function letGo(h: Hold): void {
  holding.delete(h);
  clearTimeout(h.cap);
  h.pointers.clear();
  h.key = false;
  // a task later: after the click the release brings, which may draw on its own
  if (h.missed) setTimeout(() => h.missed && run(h), 0);
}

/** the press goes on: its cap starts again */
function pressed(h: Hold): void {
  holding.add(h);
  clearTimeout(h.cap);
  h.cap = setTimeout(() => letGo(h), h.max);
}

function listen(doc: NonNullable<PressRoot["ownerDocument"]>): void {
  if (listening.has(doc)) return;
  listening.add(doc);
  const up = (e: Event) => {
    for (const h of [...holding]) {
      h.pointers.delete((e as PointerEvent).pointerId);
      if (!h.pointers.size && !h.key) letGo(h);
    }
  };
  // released anywhere: the pointer may leave the root before it lets go
  doc.addEventListener("pointerup", up, true);
  doc.addEventListener("pointercancel", up, true);
  doc.addEventListener("pointermove", (e) => {
    for (const h of [...holding]) {
      if (!h.pointers.size) continue;
      // let go outside the window, where no pointerup reaches the page: a move says so
      if ((e as PointerEvent).buttons === 0) {
        h.pointers.clear();
        if (!h.key) letGo(h);
      } else pressed(h);
    }
  }, true);
  doc.addEventListener("keyup", (e) => {
    if ((e as KeyboardEvent).key !== " ") return;
    for (const h of [...holding]) {
      h.key = false;
      if (!h.pointers.size) letGo(h);
    }
  }, true);
  // the page left (another window, another tab): what was pressed here is not heard ending
  const away = () => {
    for (const h of [...holding]) letGo(h);
  };
  doc.defaultView?.addEventListener("blur", away);
  doc.addEventListener("visibilitychange", () => doc.visibilityState === "hidden" && away());
}

/** `draw` for a region drawn again by itself (a timer, live data): called while a press is in
 *  progress in `root`, it waits, and draws once when the press ends. Otherwise it draws at once.
 *
 *    const drawSide = holdPress(body, () => keepFocus(body, () => { body.innerHTML = … }));
 *
 *  A click is a press and a release on the same element: a button replaced between the two gets
 *  no click, and a region redrawn every second loses a click in ten. So pointers pressed in
 *  `root` (until the last is released), or Space held on a control in it (a button acts on
 *  Space's release), hold its draws. The held draw runs after the release's click, and not at all
 *  if that click drew the region itself. Enter acts on its press, so it holds nothing.
 *
 *  Draws are never held for good: a hold ends `max` ms (10 000) after the press's last event, and
 *  at once when the page loses the focus or is hidden — the ways a press goes unheard. The cap is
 *  long because a slow click is still a click: a reader who rests on a button for two seconds must
 *  not lose it; only a press nothing will ever end (a lost pointerup) waits it out.
 *
 *  The document's listeners are one set for all roots; a root is known to them only while it is
 *  pressed, so there is nothing to dispose of. */
export function holdPress(root: PressRoot, draw: () => void, o: { max?: number } = {}): () => void {
  const h: Hold = { pointers: new Set(), key: false, missed: false, draw, cap: undefined, max: o.max ?? 10_000 };
  root.addEventListener("pointerdown", (e) => {
    h.pointers.add((e as PointerEvent).pointerId);
    pressed(h);
  });
  root.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key !== " ") return;
    h.key = true;
    pressed(h);
  });
  // the focus gone elsewhere with Space down: its release may never be heard here
  root.addEventListener("focusout", () => {
    if (!h.key) return;
    h.key = false;
    if (!h.pointers.size) letGo(h);
  });
  if (root.ownerDocument) listen(root.ownerDocument);
  return () => {
    if (holding.has(h)) h.missed = true;
    else run(h);
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

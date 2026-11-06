// The page, made in parts: the architecture of VisualProof's viewer, without a framework.
//
// A page is one object that every part shares. It holds three things:
//
//   - what it is given before any part is made (PageGiven: the data source, the stored settings);
//   - the state the parts keep together (PageState), set and read on the page, never in a part's
//     own variables, so that there is one place where the page's state is, and every part sees a
//     change at once;
//   - what each part gives the others: its functions and the elements it owns, listed in the part's
//     own interface (ToolbarPart, PanelPart, …).
//
// A part is a function of the page that wires one concern — the toolbar, the drawer, the keys, the
// live updates — and returns what it gives the others. The page's main file makes the parts in
// order, each from the page as it is so far: a part may call, while it is being made, only what the
// parts before it gave; in its handlers (which run later) it may call anything on the page. The
// order in main is the page's table of contents.
//
//   // page.ts: the Page type, what every part shares
//   export interface Page extends PageGiven, PageState, ToolbarPart, DrawerPart, KeysPart {}
//
//   // parttoolbar.ts
//   export interface ToolbarPart { setMode(m: Mode): void }
//   export function toolbarPart(page: Page): ToolbarPart { …; return { setMode } }
//
//   // main.ts
//   const page = await makePage<Page>({ data, S: settings, mode: "plain" }, [toolbarPart, drawerPart, keysPart]);
//
// Drawing is from state: a part's `draw()` renders its region from the page's state with HTML strings
// (dom.ts, `html`), keeping the keyboard's place (focus.ts, keepFocus). A change of state is a call:
// the part that changes it calls the draws that show it — no event bus, so that what a change does
// can be read by following the calls.

/** Makes one part of the page from the page as it is so far; what it returns is added to the page. */
export type PartMaker<P> = (page: P) => object | void | Promise<object | void>;

export interface MakeOptions {
  /** a part that reads something on the page no part has given yet throws, naming it: for
   *  development, where it shows a part made out of order or state not declared in `start` */
  strict?: boolean;
  /** told after each part is made (timing, a loader's progress) */
  made?: (name: string, k: number, of: number) => void;
}

/** The page: `start` (what it is given, and every key of its state, null where there is nothing
 *  yet), then each part in order, each one's gifts added to it. */
export async function makePage<P extends object>(start: Partial<P>, parts: PartMaker<P>[], o: MakeOptions = {}): Promise<P> {
  const page = { ...start } as P;
  let making = "";
  const view: P = o.strict
    ? new Proxy(page, {
        get(t, k, r) {
          if (typeof k === "string" && !(k in t) && k !== "then" && k !== "toJSON")
            throw new Error(`VisualKit page: ${making || "a handler"} read "${k}", which no part made before it gives (or the page's state does not declare)`);
          return Reflect.get(t, k, r);
        },
      })
    : page;
  for (const [k, make] of parts.entries()) {
    making = make.name || `part ${k + 1}`;
    const gives = await make(view);
    if (gives) Object.assign(page, gives);
    o.made?.(making, k + 1, parts.length);
  }
  making = "";
  return view;
}

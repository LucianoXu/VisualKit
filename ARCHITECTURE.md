# The architecture

How a VisualKit page is built: plain TypeScript, no framework, one page object shared by parts. The
demo (`demo/`) is a complete example and the best starting point for a new page.

## Files

```
index.html          the page's skeleton: every region present from the start, empty
                    (the bar, the strip, the side panel, the drawer, the windows' layer, the loader),
                    and the inline script that sets the theme before the first paint
style.css           @import the kit, then the page's own rules (few)
src/main.ts         makes the parts in order: the page's table of contents
src/page.ts         the Page type: what it is given, its state, and every part's interface
src/part*.ts        one concern each: the bar, the drawer, the keys, the live updates, …
```

## The page object

There is one object, `page`, that every part receives. It holds:

1. **What it is given** (`PageGiven`) before any part is made: the data, the data source, what is
   kept in this browser.
2. **Its state** (`PageState`): selection, mode, open tab, history. The state is set and read on
   the page, never in a part's private variables, so there is one place where it lives and every
   part sees a change at once. Every key is declared in `makePage`'s `start`, `null` where there is
   nothing yet.
3. **What each part gives the others**: its functions (`drawSide`, `select`, `openNote`) and the
   objects it owns (`drawer`, `menu`), listed in that part's interface. `Page` extends them all.

```ts
// page.ts
export interface Page extends PageGiven, PageState, CanvasPart, BarPart, SidePart, DrawerPart {}

// partside.ts
export interface SidePart { drawSide(): void }
export function sidePart(page: Page): SidePart {
  const body = $("#side-body");
  const drawSide = () => keepFocus(body, () => { body.innerHTML = String(html`…`); });
  body.addEventListener("click", (e) => { …; page.select(id); });   // another part's, called later
  return { drawSide };
}

// main.ts
const page = await makePage<Page>({ items, selected: null, mode: "select" },
  [canvasPart, barPart, sidePart, drawerPart, keysPart], { strict: true });
page.refresh();
```

## The order of parts

`makePage` makes the parts in the order given, each from the page as it is so far, and adds what it
returns. While a part is being made it may call only what the parts before it gave; in its handlers,
which run once the page is whole, it may call anything. So the order in `main.ts` reads as the
page's table of contents, and a dependency at construction time is visible as an order.

`{ strict: true }` (use it in development) makes a read of anything not yet on the page throw,
naming the part and the key: a part made too early, or state not declared in `start`.

## Drawing

A part draws its region from the page's state, as an HTML string:

- **`html`** escapes every value written into the template (arrays joined; `raw(...)` for markup the
  code itself wrote, such as an icon). Data never reaches `innerHTML` unescaped. `null`, `undefined`
  and `false` write nothing, so `${open && html`…`}` leaves nothing when closed; but a boolean that
  is an attribute's whole value is written as the word, so `aria-expanded="${open}"` says `"false"`
  rather than `""`, which no `[aria-expanded="false"]` rule would match.
- **`keepFocus(root, draw)`** redraws `root` and puts the focus back on the like of what had it, found
  by its tag and data attributes and those of the row holding it. So give controls of redrawn
  regions data attributes that say what they are for (`data-id`, `data-act`) — they are also what
  the region's single delegated click handler reads.
- One listener per region, delegated (`closest("[data-act]")`), registered once when the part is
  made, never re-registered on redraw.

## Changes are calls

There is no event bus and no reactive store. The part that changes the state calls the draws that
show the change — usually through one function on the page (`refresh`, `select`) that knows which
regions depend on what. What a change does can be read by following the calls, and nothing is drawn
that did not change for a reason the code says.

Draw functions are idempotent and cheap enough to call whenever; a canvas draws in the next animation
frame, after the panels whose room it leaves have moved.

## Code that draws itself

A canvas or chart reads its colours from the tokens as it draws (`token("--accent")`), and draws
again on `onThemeChange`. It reads `--inset-left` and `--inset-right` on `<html>` (set by `insets()`
whenever a panel opens or closes) to centre itself on what is still seen.

## Comments

VisualProof's code says *why* in prose comments over each function, interface field and CSS rule,
and cites the decision a rule comes from. The kit keeps that habit: a comment says what the thing is
for and what would go wrong without it, not what the next line does.

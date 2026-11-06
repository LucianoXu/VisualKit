# The design

VisualKit is VisualProof's viewer reduced to its design language. This file says what that language
is and why, so that a page made with the kit looks like it belongs to the same family, and a page
that needs something the kit lacks can be extended in the same voice. The tokens are in
`src/css/tokens.css`; every rule below points at where it is applied.

## One sentence

> Quiet surfaces, one gradient for what matters.

Everything is calm, light and hairline-thin by default, so that the few things that carry colour —
the selection, the gradient name, a status — are seen at once.

## The page is a ground with things floating over it

The content (a canvas, a document, a board) fills the screen. Nothing is docked to an edge: the
bar, the side panel, the drawer, the windows all float a margin (`--edge`, 12px) from the viewport's
edges, rounded, so that the content is seen running under and around them.

| Surface      | Material             | Where                         | Radius           |
|--------------|----------------------|-------------------------------|------------------|
| bar          | glass                | top, full width, 48px high    | `--r-2xl` 16px   |
| side panel   | glass                | left, 268px                   | `--r-2xl` 16px   |
| drawer       | glass                | right, 400px, slides in       | `--r-3xl` 18px   |
| player       | glass                | foot, centred between panels  | `--r-2xl` 16px   |
| window       | solid                | anywhere; the reader's        | `--r-xl` 14px    |
| popover      | solid, ringed        | under its button              | `--r-xl` 14px    |
| menu         | solid, ringed        | at the pointer                | `--r-lg` 12px    |
| modal        | glass over a shade   | centre                        | `--r-xl` 14px    |

**Glass is for what stays; solid is for what is read.** Glass (`.vk-glass`: 78% white, blur 22px,
saturate 180%, a 0.5px line, a soft two-layer shadow) lets the content show through, blurred, so
the page reads as one place. A popover, a menu, search results and windows are read closely, so they
are solid and ringed by a 1px line under the large shadow. (VisualProof used 94–96% for these; the
kit makes them solid because controls under them showed through, most where they lay on glass.)

**What is larger and further from the pointer is rounder**: 4px inline code, 7px fields and small
buttons, 9–10px toolbar buttons and segmented controls, 12px menus, 14px popovers and windows, 16px
the bar and side panel, 18px the drawer, a full pill for chips and collapsed windows.

**The foot is the player's.** The side panel and the drawer stop at `--bottom`, leaving a 44px row
(`--player-h`) under them: the player (`.vk-player`) is centred in it on what the panels leave of the
content, and slides with the drawer; never narrower than 360px, it reaches under the drawer where
the panels leave less, and its parts give way by its own width. A legend corner keeps to the side
panel's column under it, so the two never meet; where no side panel is shown (`data-side="none"`),
and on a phone, the corner rises over it.

**One order of layers** (`--z-*`): content; panels, the player and the corners 6 (a corner's card
opened over the side panel lies over it by coming after it in the page); strip 15, bar 20, windows
35, popovers 36, menu 38, modal 40, loader 50. A popover open in the bar lifts the bar with it
(`:has`).

## Colour

**The ground is a near-white grey** (`--canvas` #f5f5f7), surfaces are white over it, lines are 8%
black. Shadows are long and faint (`0 8px 28px` at 9%), never dark.

**Text in three steps**, each at least 4.5:1 (WCAG AA) on the ground and on a solid surface in both
themes: `--text` for what is read, `--text-2` for what describes it, `--text-3` for counts, hints
and what is muted. A new grey must pass the same check; VisualProof's owner found a third step at
2.5:1 once, and it was fixed.

**One gradient, used rarely** (`--grad`: indigo → violet → pink-red). It is the logo, the name of
what is selected (`.vk-title`), a progress line. Its relatives (`--grad-violet`, `--grad-cool`,
`--grad-warm`) tell big numbers apart side by side (`.vk-stat`). Anything else in the gradient
dilutes it.

**One accent** (`--accent`, a violet a step deeper than the gradient's middle so that it is 4.5:1 on
the ground): links, the focus ring, the lit thing, the open tab's ring, a switch that is on. Hover
turns a control's border to the accent; it never fills it.

**Colour means something, or is not there.** Green is good (`--ok`), blue informs (`--info`, a calm
cobalt that reads as "something to read", not an alarm), amber asks for attention, red is wrong or
removes (`--bad`). Solid buttons in those colours use a shade deeper (`--ok-btn`, `--info-btn`) so
that white text stays at 4.5:1. For states everyone must tell apart — colour-blind readers too — use
the Okabe–Ito palette (`--cb-*`), and separate quiet states by lightness, not only hue.

**Dark is "Midnight"**: a blue-black ground (#0d1017), surfaces, lines and tints of the same blue,
a cool white text, the accent lighter (#a08cff, 6.2:1). All of it in one block of tokens; nothing
else in the CSS mentions the theme. Light is the default on every platform; the reader may choose
dark or "as the system". The theme is set before the first paint, so a dark page never flashes
light.

## Type

The system's UI font (`--font`: SF Pro, Inter, Segoe UI, Roboto) at 13px for the body, 12.5px for
controls, 11.5px for small text, 11px for spaced-capital overlines (`.vk-overline`, 0.06em). Titles
are heavy and tight: 15px 600 for a window or modal, 18px 700 for the drawer, 26px 700 with -0.025em
letter-spacing for the gradient name. Numbers in columns are tabular (`.vk-num`). Code and names are
in `--mono`.

## Motion

Panels slide with a quick start and a long settle (`--ease-out`, 0.32s); what moves with a camera
eases both ways (`--ease-in-out`). Hover changes take 0.15s. Running things pulse; a place gone to
flashes in the accent and fades (`.vk-flash`).

**Reduced motion is honoured everywhere at once**: `css/base.css` ends every transition and
animation within a millisecond (not removes them, so code waiting for their end still hears it),
and script asks `reducedMotion()` before it animates. Where an animation says something, it gets a
still form: the flash holds for four seconds instead of fading.

## Behaviour that is part of the style

- **Quiet until wanted.** A row's action shows on the row under the pointer or with the keyboard on
  it (`.vk-row-act`). Less used controls live in popovers behind an icon. A hint is said under its
  control while the pointer rests there, and nowhere else (`hint`).
- **Left out, not greyed.** A menu offers what can be done here, by this reader; what cannot is not
  listed. A button that is shown but cannot be used looks it (faded) and says why in its title.
- **Keyboard first-class.** Every popover, menu and modal is driven by keys; focus goes into what
  opens from the keyboard and back to its button when it closes (`focusBack`); a region redrawn
  from HTML keeps the keyboard's place (`keepFocus`).
- **The reader's arrangement is kept.** Where they put a window, what they folded, their theme —
  kept in this browser, read back with care (`kept`, `storageKeeper`).
- **A phone is the same page, rearranged**: the side panel goes, the drawer becomes a sheet from the
  bottom with a grip, a window docks at the bottom (or fills the screen, `.full`), fields are 16px so
  iOS does not zoom.

## Where it came from

From VisualProof 0.9.0's `src/web/style.css` and `src/web/src/` (Apache-2.0). Each component kept
VisualProof's measures; names were made generic (`.rv-btn` → `.vk-btn`, `#ctxmenu` → `.vk-menu`,
`.sw-win` → `.vk-win`, `#panel` → `.vk-drawer`). What was VisualProof's own — the declaration
graph's colours, the review's statuses, the Lean highlighting, the artwork mode — was left out, or
kept only as a general palette (`--cat-*` from the declaration kinds).

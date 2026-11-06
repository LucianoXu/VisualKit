# VisualKit

The design language and page architecture of VisualProof's viewer
(<https://github.com/LucianoXu/VisualProof>, `src/web/`), distilled into a framework-free kit.
`README.md` is for people using it, `DESIGN.md` says what the style is and why, `ARCHITECTURE.md`
how a page is built.

## Layout

- `src/css/` — the stylesheet in five files (`visualkit.css` imports them); tokens in `tokens.css`.
- `src/ts/` — the primitives; `index.ts` exports them all.
- `demo/` — a whole page made of parts (`demo/src/main.ts`), the template for a new page, and the
  token specimen (`demo/tokens.html`).
- `docs/images/` — the README's pictures, taken from the built demo at 2x and saved as WebP.
- `test/` — `npm test`, the parts that run without a browser.
- `stignore-build/` — derived output (the built demo, screenshots); not synced, not tracked.

## Rules

- Comments and documentation in English; chat in the user's language.
- Every colour the dark theme changes lives in its one block of `tokens.css`. A new text colour is
  4.5:1 or more on the ground and on a solid surface, in both themes.
- Class names carry the `vk-` prefix; tokens do not (pages use them directly).
- Data reaches `innerHTML` only through `html` or `escapeHtml`.
- A change to a component is checked in the demo, in both themes and at phone width (390px), before
  it is called done: `npm run build`, then look at `stignore-build/demo/` in a browser.
- `npm test` and `npm run typecheck` pass.

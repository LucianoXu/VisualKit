// The keys: / the search, 1–3 the modes, Space plays or pauses the run, t the theme, w a window for what is selected, Esc nothing
// selected, Alt+← and Alt+→ back and forward. None fires while the reader is typing in a field.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { setTheme, themeShown, typing } from "../../src/ts/index.ts";
import type { Page } from "./page.ts";

export type KeysPart = object;

export function keysPart(page: Page): KeysPart {
  addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      return page.step(e.key === "ArrowLeft" ? -1 : 1);
    }
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      page.search.focus();
    } else if (e.key === "1" || e.key === "2" || e.key === "3") page.setMode((["select", "uses", "used"] as const)[Number(e.key) - 1]);
    // on a button, Space presses it
    else if (e.key === " " && !(e.target as Element).closest?.("button, a, [role=radio], [role=switch]")) {
      e.preventDefault();
      page.play();
    } else if (e.key === "t") setTheme(themeShown() === "dark" ? "light" : "dark");
    else if (e.key === "w" && page.selected) page.openNote(page.selected);
    else if (e.key === "Escape" && page.selected) page.select(null);
  });
  return {};
}

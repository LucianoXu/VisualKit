// The menu on the board and on the side panel's rows: what can be done with what it was opened on.
// What the reader cannot do there is left out, not greyed.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, ContextMenu, contextMenuOn } from "../../src/ts/index.ts";
import type { MenuItem } from "../../src/ts/index.ts";
import type { Page } from "./page.ts";

export interface MenuPart {
  menu: ContextMenu;
}

export function menuPart(page: Page): MenuPart {
  const menu = new ContextMenu();

  const on = (id: string): { items: MenuItem[]; heading: string } => {
    const it = page.byId.get(id)!;
    return {
      heading: it.id,
      items: [
        { label: "Select", key: "click", run: () => page.select(id) },
        { label: "Open in a window", key: "w", run: () => page.openNote(id) },
        {
          label: "Light up",
          sub: [
            { label: "What it uses", run: () => (page.select(id), page.setMode("uses")) },
            { label: "What uses it", run: () => (page.select(id), page.setMode("used")) },
          ],
        },
        { label: "Copy name", note: "clipboard", sep: true, run: () => void navigator.clipboard?.writeText(it.id) },
        ...(it.status === "failed" ? [] : [{ label: "Remove from board", bad: true, sep: true, run: () => page.select(null) }]),
      ],
    };
  };

  contextMenuOn($("#canvas"), menu, ({ x, y }) => {
    const id = page.itemAt(x, y);
    if (id) return on(id);
    return {
      heading: "Board",
      items: [
        { label: "Clear selection", key: "Esc", disabled: !page.selected, run: () => page.select(null) },
        { label: "Activity", run: () => page.openActivity() },
      ],
    };
  });
  contextMenuOn($("#side-body"), menu, ({ target }) => {
    const id = target.closest<HTMLElement>("[data-id]")?.dataset.id;
    return id ? on(id) : null;
  });

  return { menu };
}

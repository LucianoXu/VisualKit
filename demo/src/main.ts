// The demo page: the kit's components in one app, made in parts as VisualProof's viewer is.
//
// The order below is the page's table of contents. A part may call, while it is made, what the
// parts before it gave; its handlers may call anything (they run once the page is whole).

import { $, makePage, themeKey, kept, isStrings } from "../../src/ts/index.ts";
import { makeItems } from "./data.ts";
import type { Page } from "./page.ts";
import { canvasPart } from "./partcanvas.ts";
import { barPart } from "./partbar.ts";
import { stripPart } from "./partstrip.ts";
import { sidePart } from "./partside.ts";
import { drawerPart } from "./partdrawer.ts";
import { windowsPart } from "./partwindows.ts";
import { menuPart } from "./partmenu.ts";
import { legendPart } from "./partlegend.ts";
import { livePart } from "./partlive.ts";
import { playerPart } from "./partplayer.ts";
import { keysPart } from "./partkeys.ts";

themeKey("visualkit-demo:theme");

const items = makeItems();
const page = await makePage<Page>(
  {
    items,
    byId: new Map(items.map((it) => [it.id, it])),
    folded: kept("visualkit-demo:folded", [], isStrings),
    selected: null,
    mode: "select",
    tab: "board",
    history: [null],
    at: 0,
    unfolded: new Set(["uses"]),
    tick: 0,
    time: 0,
    playing: false,
    speed: 1,
    filter: false,
  },
  [canvasPart, barPart, stripPart, sidePart, drawerPart, windowsPart, menuPart, legendPart, livePart, playerPart, keysPart],
  { strict: true },
);

page.refresh();
page.play(true);
$("#loader").classList.add("gone");

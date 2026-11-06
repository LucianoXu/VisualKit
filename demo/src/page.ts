// The demo page as its parts share it (demo/src/main.ts makes the parts, in order). Each part gives
// the others what its interface lists; the state they keep together is the page's, set and read on
// it; what the page is given comes before any part is made.

import type { Kept as KeptValue } from "../../src/ts/store.ts";
import type { CanvasPart } from "./partcanvas.ts";
import type { BarPart } from "./partbar.ts";
import type { StripPart } from "./partstrip.ts";
import type { SidePart } from "./partside.ts";
import type { DrawerPart } from "./partdrawer.ts";
import type { WindowsPart } from "./partwindows.ts";
import type { MenuPart } from "./partmenu.ts";
import type { LegendPart } from "./partlegend.ts";
import type { LivePart } from "./partlive.ts";
import type { PlayerPart } from "./partplayer.ts";
import type { KeysPart } from "./partkeys.ts";

export type Kind = "definition" | "theorem" | "lemma" | "instance" | "axiom";
export type Mode = "select" | "uses" | "used";

/** A thing on the board. */
export interface Item {
  id: string;
  name: string;
  group: string;
  kind: Kind;
  /** what it uses, by id */
  uses: string[];
  status: "ok" | "running" | "attention" | "failed";
  note: string;
}

/** The kinds' colours: the kit's categorical palette. */
export const KIND_COLOUR: Record<Kind, string> = {
  definition: "--cat-1",
  theorem: "--cat-6",
  lemma: "--cat-3",
  instance: "--cat-5",
  axiom: "--cat-8",
};

/** What the page is given before any part is made. */
export interface PageGiven {
  items: Item[];
  byId: Map<string, Item>;
  /** the groups folded in the side panel, kept in this browser */
  folded: KeptValue<string[]>;
}

/** The state the parts keep together. */
export interface PageState {
  selected: string | null;
  mode: Mode;
  tab: string;
  /** the places gone to, for back and forward, and where in them the page is */
  history: (string | null)[];
  at: number;
  /** the drawer's sections the reader has open, kept across its redraws */
  unfolded: Set<string>;
  /** the run's second on show (partlive.ts): the board as it was then */
  tick: number;
  /** the playhead, in seconds into the run; whether it moves, and how fast */
  time: number;
  playing: boolean;
  speed: number;
  /** the side panel shows only what is not fine */
  filter: boolean;
}

/** the run's length, in seconds: a tick each */
export const TICKS = 180;

export interface Page extends PageGiven, PageState, CanvasPart, BarPart, StripPart, SidePart, DrawerPart, WindowsPart, MenuPart, LegendPart, LivePart, PlayerPart, KeysPart {}

/** What is lit with the selection, by the mode: the item itself, what it uses, or what uses it. */
export function lit(page: Page): Set<string> {
  const out = new Set<string>();
  const s = page.selected;
  if (!s) return out;
  out.add(s);
  if (page.mode === "uses") for (const u of page.byId.get(s)?.uses ?? []) out.add(u);
  if (page.mode === "used") for (const it of page.items) if (it.uses.includes(s)) out.add(it.id);
  return out;
}

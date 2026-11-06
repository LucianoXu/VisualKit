// The player: the strip at the foot of the board that plays the run back (partlive.ts) — play and
// pause, the time, a track to scrub, the speed. The kit's Player makes its controls once and changes
// them in place, so it is drawn many times a second without losing a press.
//
// A part of the page: demo/src/main.ts makes the parts in order, demo/src/page.ts says what they share.

import { $, Player } from "../../src/ts/index.ts";
import { TICKS } from "./page.ts";
import type { Page } from "./page.ts";

export interface PlayerPart {
  /** show the playhead, playing or not, the speed */
  drawPlayer(): void;
}

export function playerPart(page: Page): PlayerPart {
  const player = new Player($("#player"), {
    toggle: () => page.play(),
    seek: (t) => page.seekTo(t),
    speeds: [0.5, 1, 2, 4],
    speed: (s) => page.setSpeed(s),
  });
  return {
    drawPlayer: () => player.show({ playing: page.playing, at: page.time, length: TICKS, speed: page.speed }),
  };
}

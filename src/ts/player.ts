// The player: a strip at the foot of the content for what plays over time — a replay, a recording,
// an animation — with play and pause, the time, a track to scrub, and the speeds
// (css/surfaces.css, .vk-player: centred on what the panels leave of the content).
//
// Its controls are made once and changed in place by `show`, never drawn again: the strip changes
// many times a second while it plays, and a control replaced under the pointer loses its click (and
// a track replaced under a drag, the drag). The page keeps the state — playing, where, how fast —
// and calls `show` whenever it changes; a press here asks the page to change it.
//
//   <div class="vk-player vk-glass" id="player" aria-label="Replay"></div>
//   const player = new Player($("#player"), { toggle: () => page.play(), seek: (t) => page.seekTo(t), speeds: [0.5, 1, 2], speed: (s) => page.setSpeed(s) });
//   player.show({ playing: page.playing, at: page.time, length: 180, speed: page.speed });

import { html, raw } from "./dom.ts";
import { icon } from "./icons.ts";

export interface PlayerOptions {
  /** play or pause: the page changes its state, then calls `show` */
  toggle(): void;
  /** the reader moved the playhead to `at` (in the unit of `length`); without it, no track */
  seek?(at: number): void;
  /** the speeds offered (1 is as recorded); without them, no speeds */
  speeds?: readonly number[];
  speed?(s: number): void;
  /** a time as written (default m:ss, h:mm:ss from an hour), from seconds */
  clock?(s: number): string;
}

export interface PlayerState {
  playing: boolean;
  /** where the playhead is, from 0 to `length` (seconds, for the default clock) */
  at: number;
  length: number;
  speed?: number;
}

/** m:ss, or h:mm:ss from an hour; –:–– for what is not a time (NaN, Infinity) */
export function clock(s: number): string {
  if (!Number.isFinite(s)) return "–:––";
  const t = Math.max(0, Math.floor(s));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), ss = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** ½× rather than 0.5× */
const speedLabel = (s: number): string => (s === 0.25 ? "¼×" : s === 0.5 ? "½×" : `${s}×`);

export class Player {
  readonly el: HTMLElement;
  private o: PlayerOptions;
  private play: HTMLButtonElement;
  private now: HTMLElement;
  private total: HTMLElement;
  private track: HTMLInputElement | null;
  /** the reader is dragging the track: what plays must not pull it from under them */
  private dragging = false;
  private last: PlayerState | null = null;

  constructor(el: HTMLElement, o: PlayerOptions) {
    this.el = el;
    this.o = o;
    if (!el.hasAttribute("role")) el.setAttribute("role", "group");
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", "Player");
    // both icons are in the button and CSS shows one: swapping them would replace what is pressed
    el.innerHTML = String(html`
      <button type="button" class="vk-act icon vk-player-play" aria-label="Play" title="Play">${raw(icon("play", 14))}${raw(icon("pause", 14))}</button>
      <span class="vk-player-time"><b>0:00</b><span class="vk-player-total"></span></span>
      ${o.seek ? html`<input class="vk-player-track" type="range" min="0" max="1" step="any" value="0" aria-label="Playhead">` : ""}
      ${o.speeds?.length
        ? html`<div class="vk-seg mini vk-player-speed" role="radiogroup" aria-label="Speed">${o.speeds.map(
            (s) => html`<button type="button" role="radio" data-speed="${s}" aria-checked="false" title="Play at ${s}×">${speedLabel(s)}</button>`,
          )}</div>`
        : ""}`);
    this.play = el.querySelector(".vk-player-play")!;
    this.now = el.querySelector(".vk-player-time > b")!;
    this.total = el.querySelector(".vk-player-total")!;
    this.track = el.querySelector(".vk-player-track");

    this.play.addEventListener("click", () => o.toggle());
    this.track?.addEventListener("input", () => {
      this.dragging = true;
      o.seek!(Number(this.track!.value));
    });
    this.track?.addEventListener("change", () => (this.dragging = false));
    el.querySelector(".vk-player-speed")?.addEventListener("click", (e) => {
      const b = (e.target as Element).closest<HTMLElement>("[data-speed]");
      if (!b || !o.speeds) return;
      const v = Number(b.dataset.speed);
      // in a narrow strip only the speed in force shows (css): a press on it goes to the next
      const alone = ![...this.el.querySelectorAll<HTMLElement>("[data-speed]")].some((x) => x !== b && x.getClientRects().length);
      o.speed?.(alone && v === this.last?.speed ? o.speeds[(o.speeds.indexOf(v) + 1) % o.speeds.length] : v);
    });
  }

  /** Show the page's state: only what changed is touched, nothing is replaced. */
  show(s: PlayerState): void {
    const was = this.last;
    const write = this.o.clock ?? clock;
    if (s.playing !== was?.playing) {
      const say = s.playing ? "Pause" : "Play";
      this.play.classList.toggle("playing", s.playing);
      this.play.setAttribute("aria-label", say);
      this.play.title = say;
    }
    const now = write(s.at);
    if (this.now.textContent !== now) this.now.textContent = now;
    if (s.length !== was?.length) {
      this.total.textContent = ` / ${write(s.length)}`;
      if (this.track) this.track.max = String(s.length);
    }
    if (this.track && !this.dragging) this.track.value = String(s.at);
    if (s.speed !== was?.speed)
      for (const b of this.el.querySelectorAll<HTMLElement>("[data-speed]")) {
        const on = Number(b.dataset.speed) === s.speed;
        b.classList.toggle("on", on);
        b.setAttribute("aria-checked", String(on));
      }
    this.last = { ...s };
  }
}

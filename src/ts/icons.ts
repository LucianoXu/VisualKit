// Icons: drawn on a 16-unit grid as strokes in the current colour, never filled, their ends and
// joins round. The control around them sets the stroke's width (1.6 in a window's bar, 1.8 in the
// toolbar, 2.2 for the chevrons of back and forward), so one drawing serves every size.
//
//   button.innerHTML = icon("share") + "<span>Share</span>";

const PATHS = {
  back: `<path d="M10 3.5 5.5 8l4.5 4.5"/>`,
  forward: `<path d="M6 3.5 10.5 8 6 12.5"/>`,
  close: `<path d="M4 4l8 8M12 4l-8 8"/>`,
  collapse: `<path d="M4 8h8"/>`,
  more: `<path d="M3.5 8h.01M8 8h.01M12.5 8h.01"/>`,
  share: `<path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8"/>`,
  library: `<path d="M3 2.8h3.2v10.4H3zM7.4 2.8h3v10.4h-3zM11 3.4l2.4-.6 1.5 10-2.4.6z"/>`,
  export: `<path d="M8 2.5v7.5M5 7l3 3 3-3M3 11.5v1.8h10v-1.8"/>`,
  activity: `<path d="M2 8h2.5l1.5-4 3 8 1.5-4H14"/>`,
  chat: `<path d="M3.2 3h9.6c.7 0 1.2.5 1.2 1.2v5.6c0 .7-.5 1.2-1.2 1.2H7.6L4.6 13.4V11H3.2C2.5 11 2 10.5 2 9.8V4.2C2 3.5 2.5 3 3.2 3z"/>`,
  search: `<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2 13.5 13.5"/>`,
  plus: `<path d="M8 3v10M3 8h10"/>`,
  minus: `<path d="M3 8h10"/>`,
  fit: `<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>`,
  pin: `<path d="M6 2.5h4l-.6 4 2.1 2.1H4.5l2.1-2.1zM8 8.6v4.9"/>`,
  file: `<path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3"/>`,
  folder: `<path d="M2.5 4.2c0-.6.5-1.2 1.2-1.2h2.6l1.4 1.5h4.6c.6 0 1.2.5 1.2 1.2v5.9c0 .6-.5 1.2-1.2 1.2H3.7c-.7 0-1.2-.6-1.2-1.2z"/>`,
  shield: `<path d="M8 2l5 2v4c0 3-2.2 5.2-5 6-2.8-.8-5-3-5-6V4z"/>`,
  check: `<path d="M3.5 8.5l3 3 6-7"/>`,
  sun: `<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>`,
  moon: `<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z"/>`,
  monitor: `<rect x="2" y="3" width="12" height="8.5" rx="1.5"/><path d="M6 14h4M8 11.5V14"/>`,
  settings: `<circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1"/>`,
} as const;

export type IconName = keyof typeof PATHS;

/** An icon as SVG markup, `size` pixels square, hidden from assistive technology (the control
 *  carries the name). */
export function icon(name: IconName, size = 15): string {
  return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true">${PATHS[name]}</svg>`;
}

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

// Light, dark, or as the system is: the reader's choice, kept in this browser; light unless they
// chose otherwise. The page's colours follow `data-theme` on <html> (css/tokens.css). A script in
// the page's <head> sets it before the first paint from the same stored choice, so a dark page never
// flashes light: write it with `themeHeadScript()` (or copy the one in demo/index.html).
//
// What draws in the theme's colours itself — a canvas, a chart — reads them from the page's custom
// properties as it draws (`token`), and draws again when the theme on show changes (onThemeChange),
// whoever changed it.
//
// The system's other preference the page follows is reduced motion: css/base.css ends every
// transition at once, and code that moves things by itself asks `reducedMotion()` first.

import { escapeHtml } from "./dom.ts";

export type ThemeChoice = "light" | "dark" | "system";
export type ThemeShown = "light" | "dark";

let KEY = "visualkit:theme";
const dark = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
/** the theme something holds on show over the reader's choice (holdTheme), or none */
let held: ThemeShown | null = null;

/** Where the choice is kept: call once, before anything else here, with your app's own key. */
export function themeKey(key: string): void {
  KEY = key;
}

/** The inline script for the page's <head>, which sets the theme before the first paint. */
export function themeHeadScript(key = KEY): string {
  const k = JSON.stringify(key);
  return `try{var t=localStorage.getItem(${k});document.documentElement.dataset.theme=t==="dark"?"dark":t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}`;
}

/** Whether the system asks for reduced motion: what would glide goes where it goes at once. Read as
 *  it is asked, so that a change of the setting holds from the next motion. */
export const reducedMotion = (): boolean => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function themeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "dark" || v === "system") return v;
  } catch {
    // storage blocked: the default
  }
  return "light";
}

/** The theme on show now. */
export const themeShown = (): ThemeShown => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** Put the choice in force: what <html> says, now and (for "system") whenever the system changes;
 *  while a theme is held (holdTheme), that one. */
export function applyTheme(choice: ThemeChoice = themeChoice()): void {
  const t = held ?? (choice === "system" ? (dark?.matches ? "dark" : "light") : choice);
  if (document.documentElement.dataset.theme !== t) document.documentElement.dataset.theme = t;
}

/** Show `t` whatever the reader chose, until it is let go (null): a mode that must look one way (an
 *  export's preview), which a change of the system's must not undo while it is on. */
export function holdTheme(t: ThemeShown | null): void {
  held = t;
  applyTheme();
}

export function setTheme(choice: ThemeChoice): void {
  try {
    // the default is kept as nothing, so that a later change of the default reaches whoever never chose
    if (choice === "light") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    // not kept: in force for this page only
  }
  applyTheme(choice);
}

dark?.addEventListener("change", () => {
  if (themeChoice() === "system") applyTheme("system");
});

const followers: (() => void)[] = [];
let watching: MutationObserver | null = null;
let shown: string | undefined;

/** Call `f` whenever the theme on show changes, light to dark or back, by whatever means: it is read
 *  from <html> itself, so that no way of changing it is missed. */
export function onThemeChange(f: () => void): void {
  followers.push(f);
  if (watching || typeof MutationObserver === "undefined") return;
  shown = document.documentElement.dataset.theme;
  watching = new MutationObserver(() => {
    const now = document.documentElement.dataset.theme;
    if (now === shown) return;
    shown = now;
    for (const g of followers) g();
  });
  watching.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

/** A token's value as the theme on show has it (`token("--accent")`): for code that draws. */
export function token(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

const ICONS: Record<ThemeChoice, string> = {
  light: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>`,
  dark: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z"/></svg>`,
  system: `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="2" y="3" width="12" height="8.5" rx="1.5"/><path d="M6 14h4M8 11.5V14"/></svg>`,
};
const LABELS: Record<ThemeChoice, string> = { light: "Light", dark: "Dark", system: "As the system" };

/** The three choices side by side, as a segmented control drawn into `el` (a `.vk-seg`). */
export function themeChoices(el: HTMLElement): void {
  el.setAttribute("role", "radiogroup");
  el.setAttribute("aria-label", "Theme");
  const render = () => {
    const c = themeChoice();
    el.innerHTML = (["light", "dark", "system"] as ThemeChoice[])
      .map((k) => `<button type="button" data-theme-choice="${k}" class="${k === c ? "on" : ""}" role="radio" aria-checked="${k === c}" title="${escapeHtml(LABELS[k])}" aria-label="${escapeHtml(LABELS[k])}">${ICONS[k]}</button>`)
      .join("");
  };
  render();
  el.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-theme-choice]");
    if (!b) return;
    setTheme(b.dataset.themeChoice as ThemeChoice);
    render();
  });
}

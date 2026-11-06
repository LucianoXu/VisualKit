// Modal windows: a question the page cannot go on without. Glass over a light shade, the question
// in a sentence, its buttons at the right, the one it is for solid. Esc or a press on the shade is
// Cancel; the focus is kept inside while it is open and goes back where it was after.
//
//   if (await confirm({ title: "Delete this view?", text: "Everyone on it goes back to the Project.", ok: "Delete", bad: true })) …
//   const name = await ask({ title: "Rename", value: view.title });

import { escapeHtml } from "./dom.ts";
import { firstControl, trapFocus } from "./focus.ts";

export interface ModalOptions {
  title: string;
  /** a sentence under the title: plain text */
  text?: string;
  /** the button the box is for, and the other one */
  ok?: string;
  cancel?: string;
  /** the button the box is for removes or revokes */
  bad?: boolean;
  wide?: boolean;
}

/** Open a modal with `body` (HTML) between the text and the buttons; resolves with the button
 *  pressed, and the box (read its fields before it goes). */
export function modal(o: ModalOptions, body = ""): Promise<{ ok: boolean; box: HTMLElement }> {
  const was = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const shade = document.createElement("div");
  shade.className = "vk-modal";
  shade.innerHTML =
    `<form class="vk-modal-box vk-glass${o.wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="vk-modal-title">` +
    `<div class="vk-modal-title" id="vk-modal-title">${escapeHtml(o.title)}</div>` +
    (o.text ? `<div class="vk-modal-text">${escapeHtml(o.text)}</div>` : "") +
    body +
    `<div class="vk-actions">` +
    `<button type="button" class="vk-btn" data-cancel>${escapeHtml(o.cancel ?? "Cancel")}</button>` +
    `<button type="submit" class="vk-btn ${o.bad ? "bad" : "primary"}">${escapeHtml(o.ok ?? "OK")}</button>` +
    `</div></form>`;
  document.body.append(shade);
  const box = shade.firstElementChild as HTMLFormElement;
  const untrap = trapFocus(box);
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      untrap();
      resolve({ ok, box });
      shade.remove();
      was?.focus({ preventScroll: true });
    };
    box.addEventListener("submit", (e) => {
      e.preventDefault();
      done(true);
    });
    box.querySelector("[data-cancel]")!.addEventListener("click", () => done(false));
    shade.addEventListener("pointerdown", (e) => {
      if (e.target === shade) done(false);
    });
    shade.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        done(false);
      }
    });
    // a field takes the focus first; else the button the box is for
    (box.querySelector<HTMLElement>("input, textarea, select") ?? box.querySelector<HTMLElement>("[type=submit]") ?? firstControl(box))?.focus();
  });
}

/** Yes or no. */
export async function confirm(o: ModalOptions): Promise<boolean> {
  return (await modal(o)).ok;
}

/** A line of text, or null where the reader cancelled (or left it empty). */
export async function ask(o: ModalOptions & { value?: string; placeholder?: string }): Promise<string | null> {
  const body = `<input class="vk-input" name="value" maxlength="200" spellcheck="false" value="${escapeHtml(o.value ?? "")}" placeholder="${escapeHtml(o.placeholder ?? "")}" aria-label="${escapeHtml(o.title)}">`;
  const { ok, box } = await modal(o, body);
  const v = box.querySelector<HTMLInputElement>("input")!.value.trim();
  return ok && v ? v : null;
}

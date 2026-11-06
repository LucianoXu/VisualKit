// Light Markdown, for what people write: comments, messages, notes. Nothing written becomes HTML of
// its own: the text is escaped first, and only the marks below make elements. Paragraphs keep their
// line breaks; quotes (`>`), fenced code, lists (`-`, `*`, `1.`), `code`, **bold**, *italics* and
// _italics_, and links whose address is http(s) — any other scheme stays text, `javascript:` and all.
// Style it with `.vk-md` (css/content.css).

import { escapeHtml } from "./dom.ts";

const MAX_DEPTH = 4;

/** code spans and links: taken out first, so that no mark reaches inside them (an address's `_`) */
const TOKEN = /(`[^`\n]+`)|\[([^\]\n]+)\]\((https?:\/\/[^\s()]+)\)/g;

const emphasis = (s: string): string =>
  escapeHtml(s)
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?!\w)/g, "$1<i>$2</i>")
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1<i>$2</i>");

function inline(text: string): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    out += emphasis(text.slice(last, m.index));
    out += m[1]
      ? `<code>${escapeHtml(m[1].slice(1, -1))}</code>`
      : `<a href="${escapeHtml(m[3])}" target="_blank" rel="noopener noreferrer">${emphasis(m[2])}</a>`;
    last = m.index + m[0].length;
  }
  return out + emphasis(text.slice(last));
}

function render(lines: string[], depth: number): string {
  const out: string[] = [];
  let k = 0;
  while (k < lines.length) {
    const line = lines[k];
    const fence = /^```(\S*)\s*$/.exec(line);
    if (fence) {
      const code: string[] = [];
      k++;
      while (k < lines.length && !/^```\s*$/.test(lines[k])) code.push(lines[k++]);
      k++;
      out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    } else if (/^>\s?/.test(line) && depth < MAX_DEPTH) {
      const q: string[] = [];
      while (k < lines.length && /^>\s?/.test(lines[k])) q.push(lines[k++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${render(q, depth + 1)}</blockquote>`);
    } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (k < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[k])) items.push(`<li>${inline(lines[k++].replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>`);
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
    } else if (!line.trim()) {
      k++;
    } else {
      const p: string[] = [];
      while (k < lines.length && lines[k].trim() && !/^(```|>|\s*([-*]|\d+\.)\s+)/.test(lines[k])) p.push(lines[k++]);
      out.push(`<p>${inline(p.join("\n"))}</p>`);
    }
  }
  return out.join("");
}

/** `text` as HTML, for an element with the class `vk-md`. */
export function markdown(text: string): string {
  return render(text.replace(/\r\n?/g, "\n").split("\n"), 0);
}

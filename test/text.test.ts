// Text made into HTML: nothing written becomes markup of its own.
import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, html, raw } from "../src/ts/dom.ts";
import { markdown } from "../src/ts/markdown.ts";
import { focusKey } from "../src/ts/focus.ts";
import type { KeyedEl } from "../src/ts/focus.ts";
import { makePage } from "../src/ts/page.ts";

test("escapeHtml escapes content and attribute quotes", () => {
  assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
});

test("html escapes values, joins arrays, writes SafeHtml as it is", () => {
  const items = ["<b>", "ok"];
  assert.equal(String(html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>${null}${false}${raw("<hr>")}`), "<ul><li>&lt;b&gt;</li><li>ok</li></ul><hr>");
});

test("markdown: marks make elements, nothing else does", () => {
  assert.equal(markdown("<script>alert(1)</script>"), "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  assert.equal(markdown("**b** *i* _j_ `x<y`"), "<p><b>b</b> <i>i</i> <i>j</i> <code>x&lt;y</code></p>");
  assert.equal(markdown("> quoted\n\n- one\n- two"), "<blockquote><p>quoted</p></blockquote><ul><li>one</li><li>two</li></ul>");
  assert.equal(markdown("```\n<b>\n```"), "<pre><code>&lt;b&gt;</code></pre>");
});

test("markdown: only http(s) links, and no mark reaches inside an address", () => {
  assert.equal(markdown("[x](javascript:alert(1))"), "<p>[x](javascript:alert(1))</p>");
  assert.equal(
    markdown("[docs](https://a.org/a_b_c)"),
    `<p><a href="https://a.org/a_b_c" target="_blank" rel="noopener noreferrer">docs</a></p>`,
  );
});

test("focusKey names a control by its data attributes and its row's", () => {
  const el = (tagName: string, attrs: Record<string, string>, parentElement: KeyedEl | null, className = ""): KeyedEl => ({
    tagName,
    className,
    attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
    parentElement,
  });
  const root = el("DIV", {}, null);
  const row = el("DIV", { "data-id": "x" }, root);
  assert.equal(focusKey(el("BUTTON", { "data-act": "go" }, row), root), "button[data-act=go] < data-id=x");
  assert.equal(focusKey(el("BUTTON", {}, row, "vk-icon on"), root), "button.vk-icon < data-id=x");
});

test("makePage makes the parts in order; strict names what was read too early", async () => {
  type P = { n: number; double?: () => number; triple?: () => number };
  const page = await makePage<P>({ n: 2 }, [(p) => ({ double: () => p.n * 2 }), (p) => ({ triple: () => p.double!() + p.n })], { strict: true });
  assert.equal(page.triple!(), 6);
  await assert.rejects(
    makePage<P>({ n: 1 }, [function early(p) { p.triple!(); }], { strict: true }),
    /early read "triple"/,
  );
});

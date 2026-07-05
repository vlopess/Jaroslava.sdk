import type { ComponentDefinition } from "@jaroslava/types";

export const postComponent: ComponentDefinition = {
  kind: "post",
  displayName: "Blog Post",
  schema: {
    kind: "post",
    attributes: {
      title: { type: "string", required: true },
      date: { type: "string", required: false },
      // Declared as "string" here because the generic parser intentionally
      // does not auto-split comma-bearing attribute values (splitting is
      // component-specific — see coerceAttrValue in @jaroslava/parser).
      // @post accepts either a comma-separated string ("UX, Psychology")
      // or, if constructed programmatically, a real string[]; both are
      // normalized to an array at render time via `splitTags` below.
      tags: { type: "string", required: false },
    },
  },
  render(node, renderedChildren) {
    const title = String(node.attrs.title ?? "");
    const date = node.attrs.date ? String(node.attrs.date) : '';
    const tags = splitTags(node.attrs.tags);
    const html = [
      `<article class="jaro-post">`,
      `  <span class="jaro-post-meta">${formatDate(date)} · ${tags.map((t) => `${String(t).trim()}`).join(" · ")}</span>`,
      `  <h2 class="jaro-post-title">${title}</h2>`,
      `  <div class="jaro-post-body">${renderedChildren}</div>`, 
      `</article>`,
    ]
      .filter(Boolean)
      .join("\n");

    const css = [
      ".jaro-post {margin-bottom: 2rem;}",
      ".jaro-post-meta {font-size: 0.68rem; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.3rem;}",
      ".jaro-post-title {font-size: 0.95rem; font-weight: 600; color: var(--text); margin-bottom: 0.35rem;}",
    ];
    return { html, css };
  },
};

/**
 * `tags` is conceptually a list, but the generic parser deliberately keeps
 * comma-bearing attribute values as plain strings (splitting is component-
 * specific, not a language-level rule). @post owns the decision to split
 * its own `tags` field here, at render time.
 */
function splitTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function formatDate(dateStr : string): string {
  if(dateStr == "") return "";

  const date = new Date(dateStr);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).replace(',', '');
}

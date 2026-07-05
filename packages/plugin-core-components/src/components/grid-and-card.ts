import type { ComponentDefinition } from "@jaroslava/types";

export const gridComponent: ComponentDefinition = {
  kind: "grid",
  displayName: "Grid",
  schema: {
    kind: "grid",
    allowedChildKinds: ["card"],
  },
  render(_node, renderedChildren) {
    return {
      html: `<div class="jaro-grid">\n${renderedChildren}\n</div>`,
      css: [
        ".jaro-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin: 15px 0 }",
      ],
    };
  },
};

export const cardComponent: ComponentDefinition = {
  kind: "card",
  displayName: "Card",
  schema: {
    kind: "card",
    attributes: {
      title: { type: "string", required: true },
      description: { type: "string", required: false },
      // `cover` is intentionally NOT schema-typed here: its raw value is
      // a call-expression (e.g. img("finflow.jpg")), represented as a
      // JaroAttributeCallValue object rather than a plain string/number/
      // boolean/array/object — shapes the generic AttributeSchema checker
      // in @jaroslava/validator currently understands. Components whose
      // attributes use call syntax validate that attribute in their own
      // `validate` hook instead of via the generic schema, until/unless
      // AttributeSchema grows a "call" type (see ARCHITECTURE.md, future
      // language versions / extensibility notes).
    },
  },
  parse: {
    parseInlineHeader(remainder) {
      return remainder && remainder.includes("->") ? { link: remainder.split("->")[1]!.replace(/["]/g, "").trim() } : undefined;
    },
  },
  validate(node) {
    const diagnostics: import("@jaroslava/types").Diagnostic[] = [];
    if (!node.attrs.title) {
      diagnostics.push({
        severity: "error",
        code: "card-missing-title",
        message: "@card requires a `title` attribute.",
      });
    }
    if (node.attrs.cover !== undefined && extractCoverUrl(node.attrs.cover) === undefined) {
      diagnostics.push({
        severity: "warning",
        code: "card-invalid-cover",
        message: '@card\'s `cover` attribute should be a call expression like img("url.jpg") or a plain URL string.',
      });
    }
    return diagnostics;
  },
  render(node) {
    const title = String(node.attrs.title ?? "");
    const description = node.attrs.description ? String(node.attrs.description) : undefined;
    // `cover` is typically a Call node (img("...")) but may already have
    // been coerced to a plain string by the generic attribute parser;
    // handle both shapes defensively.
    const cover = extractCoverUrl(node.attrs.cover);
    const link = node.attrs.link ? String(node.attrs.link) : undefined;
    return {
      html: [
        link ? `<a href="${link.startsWith("https://") ? link : "https://" + link}" target="_blank" class="jaro-card-link">` : "",
        `<article class="jaro-card">`,
        cover ? `  <img class="jaro-card-cover" src="${cover}" />`: "<div class='jaro-card-cover'></div>",
        `  <h3 class="jaro-card-title">${title}</h3>`,
        description ? `  <p class="jaro-card-description">${description}</p>` : "",
        `</article>`,
        link ? `</a>` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      css: [
        ".jaro-card { background: var(--line); border: 0.5px solid var(--line); border-radius: 3px; overflow: hidden; max-height: 300px;}",
        ".jaro-card-cover { width: calc(100% - 4px); aspect-ratio: 16/9; object-fit: cover; margin: 2px; background: var(--jaro-bg); display: flex; align-items: center; justify-content: center;}",
        ".jaro-card-title {font-size: 0.82rem; font-weight: 600; color: var(--text); padding: 0 12px}",
        ".jaro-card-description {font-size: 0.7rem; color: var(--muted); padding: 0 12px}",
        ".jaro-card-link { text-decoration: none; }",
      ],
    };
  },
};

function extractCoverUrl(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && (value as { __call?: boolean }).__call) {
    const args = (value as { args: unknown[] }).args;
    return typeof args[0] === "string" ? args[0] : undefined;
  }
  return undefined;
}

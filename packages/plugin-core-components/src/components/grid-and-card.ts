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
        ".jaro-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }",
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
    return {
      html: [
        `<article class="jaro-card">`,
        cover ? `  <img class="jaro-card-cover" src="${cover}" alt="${title}" />` : "",
        `  <h3 class="jaro-card-title">${title}</h3>`,
        description ? `  <p class="jaro-card-description">${description}</p>` : "",
        `</article>`,
      ]
        .filter(Boolean)
        .join("\n"),
      css: [
        ".jaro-card { border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }",
        ".jaro-card-cover { width: 100%; aspect-ratio: 16/9; object-fit: cover; }",
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

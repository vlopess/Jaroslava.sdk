import type { ComponentDefinition } from "@jaroslava/types";

export const heroComponent: ComponentDefinition = {
  kind: "hero",
  displayName: "Hero",
  schema: {
    kind: "hero",
    attributes: {
      heading: { type: "string", required: true },
      id: { type: "string", required: false },
    },
  },
  render(node, renderedChildren) {
    const heading = String(node.attrs.heading ?? "");
    const anchor = node.attrs.id ? ` id="${String(node.attrs.id)}"` : "";
    return {
      html: [
        `<section class="jaro-hero"${anchor}>`,
        `  <h2 class="jaro-hero-heading">${heading}</h2>`,
        renderedChildren ? `  <div class="jaro-hero-body">${renderedChildren}</div>` : "",
        `</section>`,
      ].join("\n"),
      css: [
        ".jaro-hero {margin-bottom: 3rem;}",
        ".jaro-hero-heading {font-size: 1.1rem; font-weight: 700; color: var(--text);}"
      ]
    };
  },
};

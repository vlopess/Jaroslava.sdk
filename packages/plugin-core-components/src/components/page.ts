import type { ComponentDefinition } from "@jaroslava/types";

export const pageComponent: ComponentDefinition = {
  kind: "page",
  displayName: "Page",
  schema: {
    kind: "page",
    attributes: {
      title: { type: "string", required: true },
      layout: {
        type: "enum",
        enumValues: ["linkhub", "blog", "newsletter", "documentation", "portfolio", "docs"],
        required: false,
      },
      theme: { type: "enum", enumValues: ["light", "dark", "toggled"], required: false },
    },
  },
  render(node, renderedChildren, ctx) {
    const theme = (node.attrs.theme as string) ?? ctx.theme ?? "light";
    const title = (node.attrs.title as string) ?? "Untitled";
    const html = [
      "<!doctype html>",
      `<html lang="en" data-theme="${escapeAttr(theme)}">`,
      "<head>",
      '  <meta charset="utf-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
      `  <title>${escapeHtml(title)}</title>`,
      "</head>",
      `<body class="jaro-page jaro-layout-${escapeAttr(String(node.attrs.layout ?? "default"))}">`,
      renderedChildren,
      "</body>",
      "</html>",
    ].join("\n");
    return {
      html,
      css: [BASE_PAGE_CSS],
    };
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

const BASE_PAGE_CSS = `
:root[data-theme="dark"] { --jaro-bg: #0b0b0d; --jaro-fg: #f4f4f5; }
:root[data-theme="light"] { --jaro-bg: #ffffff; --jaro-fg: #0b0b0d; }
.jaro-page { background: var(--jaro-bg, #fff); color: var(--jaro-fg, #0b0b0d); font-family: system-ui, sans-serif; margin: 0; }
`;

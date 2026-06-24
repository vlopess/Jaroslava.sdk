import type {
  ComponentDefinition,
  AnyNode,
  InlineGroupNode,
  RenderContext,
} from "@jaroslava/types";
import { parseInline } from "@jaroslava/utils";

export const listComponent: ComponentDefinition = {
  kind: "list",
  displayName: "List",
  schema: {
    kind: "list",
    attributes: {
      direction: { type: "enum", enumValues: ["row", "column"], required: false },
    },
  },
  parse: {
    parseBodyLine(line, ctx) {
      // A list "row" is any line containing the `->` link arrow. Plain
      // `key: value` attribute lines (e.g. `direction: column`) never reach
      // here — the generic builder claims attribute-shaped lines before
      // offering the line to plugin hooks.
      if (!line.includes("->")) return null;
      return parseInline(line, {
        generateId: ctx.generateId,
        version: "1.0.0",
      });
    },
  },
  render(node, _renderedChildren, ctx) {
    const direction = (node.attrs.direction as string) ?? "column";
    const rows = node.children.map((child) => renderRow(child, ctx)).join("\n");
    return {
      html: `<ul class="jaro-list jaro-list-${direction}">\n${rows}\n</ul>`,
      css: [
        ".jaro-list { list-style: none; padding: 0; display: flex; gap: 0.75rem; margin: 0; }",
        ".jaro-list-column { flex-direction: column; }",
        ".jaro-list-row { flex-direction: row; }",
      ],
    };
  },
};

function renderRow(node: AnyNode, ctx: RenderContext): string {
  if (node.type === "InlineGroup") {
    return `<li class="jaro-list-item">${renderInlineGroup(node, ctx)}</li>`;
  }
  return `<li class="jaro-list-item">${ctx.renderNode(node).html}</li>`;
}

function renderInlineGroup(group: InlineGroupNode, ctx: RenderContext): string {
  return group.items.map((item) => ctx.renderNode(item).html).join(" ");
}

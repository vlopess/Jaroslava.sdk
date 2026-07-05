import type { AnyNode, ComponentNode, RenderContext, RenderOutput } from "@jaroslava/types";
import type { PluginRegistry } from "@jaroslava/core";
import { renderPrimitive, escapeHtml } from "./primitives.js";

export interface DispatchDeps {
  registry: PluginRegistry;
  options: Record<string, unknown>;
  theme?: string;
}

/**
 * Renders any single AST node to RenderOutput, recursively rendering
 * children first (components receive their children pre-rendered, per the
 * ComponentRenderHook contract in @jaroslava/types).
 */
export function renderNode(node: AnyNode, deps: DispatchDeps): RenderOutput {  
  if (node.type !== "Component" && node.type !== "Document") {
    return renderPrimitive(node, (n) => renderNode(n, deps));
  }

  const kind = node.type === "Document" ? node.kind : (node as ComponentNode).kind;
  const definition = deps.registry.getComponent(kind);

  const childOutputs = node.children.map((child) => renderNode(child, deps));
  const renderedChildrenHtml = childOutputs.map((c) => c.html).join("\n");
  const collectedCss = childOutputs.flatMap((c) => c.css ?? []);
  const collectedHead = childOutputs.flatMap((c) => c.head ?? []);

  const ctx: RenderContext = {
    theme: deps.theme,
    options: deps.options,
    renderNode: (n) => renderNode(n, deps),
  };

  if (!definition?.render) {
    // Generic fallback for unknown/render-less components: never throws,
    // always produces *something* visible plus a debugging data attribute,
    // so a missing plugin degrades gracefully instead of breaking a page.
    return {
      html: `<div class="jaro-unknown-component" data-kind="${escapeHtml(kind)}">\n${renderedChildrenHtml}\n</div>`,
      css: collectedCss,
      head: collectedHead,
    };
  }

  const output =
    node.type === "Component"
      ? definition.render(node as ComponentNode, renderedChildrenHtml, ctx)
      : definition.render(
          // A DocumentNode is structurally rendered the same way a
          // ComponentNode of the same `kind` would be (e.g. "page");
          // it differs only in the AST's `type` discriminant, not in
          // what plugins need to know about it.
          { ...node, type: "Component" } as ComponentNode,
          renderedChildrenHtml,
          ctx,
        );

  return {
    html: output.html,
    css: [...collectedCss, ...(output.css ?? [])],
    head: [...collectedHead, ...(output.head ?? [])],
  };
}

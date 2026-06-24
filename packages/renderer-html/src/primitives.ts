import type { AnyNode, RenderOutput } from "@jaroslava/types";

/**
 * Renders the structural node types that are NOT components and therefore
 * have no plugin to dispatch to. Components always go through the plugin
 * registry (see `node.ts`); this module is the leaf-level fallback.
 */
export function renderPrimitive(node: AnyNode, renderNode: (n: AnyNode) => RenderOutput): RenderOutput {
  switch (node.type) {
    case "Text":
      return { html: `<p class="jaro-text">${escapeHtml(node.value)}</p>` };

    case "Link": {
      const href = node.internal ? `#${node.href.replace(/^id:/, "")}` : node.href;
      const label = node.label ?? href;
      return { html: `<a class="jaro-link" href="${escapeAttr(href)}">${escapeHtml(label)}</a>` };
    }

    case "Call": {
      if (node.callee === "img") {
        const src = typeof node.args[0] === "string" ? node.args[0] : "";
        return { html: `<img class="jaro-img" src="${escapeAttr(src)}" alt="" />` };
      }
      // Unknown callee: render nothing visible but keep a trace comment so
      // the output is debuggable without ever throwing.
      return { html: `<!-- unhandled call: ${escapeHtml(node.callee)}(${node.args.join(", ")}) -->` };
    }

    case "CodeBlock":
      return {
        html: `<pre><code${node.language ? ` class="language-${node.language}"` : ""}>${escapeHtml(
          node.code,
        )}</code></pre>`,
      };

    case "InlineGroup":
      return { html: node.items.map((item) => renderNode(item).html).join(" ") };

    default:
      return { html: "" };
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

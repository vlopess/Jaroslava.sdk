import type { JaroAst, RenderHtmlOptions, RenderHtmlResult } from "@jaroslava/types";
import type { PluginRegistry } from "@jaroslava/core";
import { renderNode } from "./node-dispatch.js";

/**
 * Renders a full AST to HTML. Belongs to: @jaroslava/renderer-html.
 *
 * Produces one `{ html, css }` pair per DocumentNode (i.e. per `@page`).
 * CSS contributed by every component used on that page is deduplicated
 * and concatenated; with `cssOutput: "inline"` (default) it is embedded
 * as a `<style>` tag inside the returned `html` string, otherwise it is
 * returned separately for the caller to write to its own stylesheet —
 * useful for static-export tooling that wants one shared `styles.css`.
 */
export function renderHtml(
  ast: JaroAst,
  registry: PluginRegistry,
  options: RenderHtmlOptions = {},
): RenderHtmlResult {
  const cssOutput = options.cssOutput ?? "inline";
  const pretty = options.pretty ?? true;

  const pages = ast.documents.map((doc) => {
    const result = renderNode(doc, {
      registry,
      options: options.pluginOptions ?? {},
      theme: typeof doc.attrs.theme === "string" ? doc.attrs.theme : undefined,
    });

    const dedupedCss = Array.from(new Set(result.css ?? [])).join("\n");
    const dedupedHead = Array.from(new Set(result.head ?? [])).join("\n");

    let html = result.html;
    if (cssOutput === "inline" && dedupedCss) {
      html = injectIntoHead(html, `<style>${dedupedCss}</style>${dedupedHead}`);
    } else if (dedupedHead) {
      html = injectIntoHead(html, dedupedHead);
    }

    return {
      html: pretty ? html : html.replace(/\n\s*/g, ""),
      css: cssOutput === "separate" ? dedupedCss : "",
    };
  });

  return { pages };
}

function injectIntoHead(html: string, fragment: string): string {
  if (html.includes("</head>")) {
    return html.replace("</head>", `${fragment}\n</head>`);
  }
  // No <head> present (e.g. a component rendered standalone, outside a
  // @page wrapper) — prepend the fragment so styles still apply.
  return `${fragment}\n${html}`;
}

export { renderNode } from "./node-dispatch.js";
export { renderPrimitive } from "./primitives.js";

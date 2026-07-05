import type { ComponentDefinition, CodeBlockNode } from "@jaroslava/types";

export const codeComponent: ComponentDefinition = {
  kind: "code",
  displayName: "Code Block",
  parse: {
    // The inline header after `@code` (e.g. "bash") is captured as the
    // `language` attribute. The actual body is consumed verbatim by the
    // parser's builder (special-cased for kind === "code") rather than via
    // parseBodyLine, since code content must never be attribute/inline-parsed.
    parseInlineHeader(remainder) {
      return remainder ? { language: remainder } : undefined;
    },
  },
  render(node) {
    const codeChild = node.children.find((c): c is CodeBlockNode => c.type === "CodeBlock");
    const code = codeChild?.code ?? "";
    const language = codeChild?.language ?? (node.attrs.language as string | undefined);
    const langClass = language ? ` class="language-${language}"` : "";
    return {
      html: [
        `<div class="jaro-code-block">`,
        `  <pre><code${langClass}>${escapeHtml(code)}</code></pre>`,
        `</div>`,
      ].join("\n"),
      css: [
        ".jaro-code-block { background: var(--jaro-code-bg); border: 0.5px solid var(--line); border-radius: 3px; padding: 0.5rem 0.75rem; font-size: 0.75rem; color: var(--jaro-code); margin-bottom: 0.6rem; font-family: 'JetBrains Mono', monospace;}",
      ]
    };
  },
  serialize(node, ctx) {
    const codeChild = node.children.find((c): c is CodeBlockNode => c.type === "CodeBlock");
    if (!codeChild) return undefined;
    const indent = ctx.indentUnit.repeat(ctx.depth);
    const bodyIndent = ctx.indentUnit.repeat(ctx.depth + 1);
    const header = codeChild.language ? `${indent}@code ${codeChild.language}` : `${indent}@code`;
    const bodyLines = codeChild.code.split("\n").map((l) => `${bodyIndent}${l}`);
    return [header, ...bodyLines];
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

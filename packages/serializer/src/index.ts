import type { JaroAst, SerializeOptions, SerializeResult } from "@jaroslava/types";
import type { PluginRegistry } from "@jaroslava/core";
import { serializeNode } from "./component.js";

/**
 * Serializes an AST back into standardized, formatted `.jaro` source text.
 * Belongs to: @jaroslava/serializer.
 *
 * This is the inverse of @jaroslava/parser's `parse()`, and the two are
 * designed to round-trip: `parse(serialize(parse(src)))` should produce an
 * AST equivalent to `parse(src)` (modulo cosmetic formatting choices like
 * exact whitespace, which the serializer standardizes rather than preserves
 * verbatim — see Core Principle: "the serializer must generate standardized
 * and formatted output").
 */
export function serialize(
  ast: JaroAst,
  registry: PluginRegistry,
  options: SerializeOptions = {},
): SerializeResult {
  try {
    const indentUnit = options.indentUnit ?? "  ";
    const blankLineBetween = options.blankLineBetweenComponents ?? true;

    const pageBlocks = ast.documents.map((doc) => serializeNode(doc, 0, { registry, indentUnit }));
    const separator = blankLineBetween ? "\n\n" : "\n";
    const output = pageBlocks.map((lines) => lines.join("\n")).join(separator) + "\n";

    return { ok: true, value: output, diagnostics: [] };
  } catch (err) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: "serialize-fatal",
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
}

export { serializeNode } from "./component.js";
export { serializeInlineAtom } from "./primitives.js";

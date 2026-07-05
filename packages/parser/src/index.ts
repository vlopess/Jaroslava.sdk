import type { JaroAst, ParseOptions, ParseResult } from "@jaroslava/types";
import type { PluginRegistry } from "@jaroslava/core";
import { generateId } from "@jaroslava/utils";
import { tokenizeLines } from "./lexer.js";
import { buildDocuments } from "./builder.js";


/**
 * Parses Jaroslava source text into an AST.
 *
 * Belongs to: @jaroslava/parser
 *
 * @param source   Raw `.jaro` file contents.
 * @param registry A PluginRegistry (from @jaroslava/core) with whatever
 *                  component plugins should be recognized. Components not
 *                  found in the registry are kept as generic ComponentNodes
 *                  with a diagnostic, never dropped — see Core Principle #2
 *                  (the source must never be required again after parsing,
 *                  so silently dropping unknown content would violate it).
 */
export function parse(
  source: string,
  registry: PluginRegistry,
  options: ParseOptions = {},
): ParseResult {
  try {
    const lines = tokenizeLines(source);
    const diagnostics: import("@jaroslava/types").Diagnostic[] = [];
    const documents = buildDocuments(lines, {
      registry,
      generateId,
      diagnostics,
      tolerateUnknownComponents: options.tolerateUnknownComponents ?? true,
    });

    const ast: JaroAst = {
      documents,
      diagnostics,
    };

    const hasFatalError = diagnostics.some((d) => d.severity === "error");
    return { ok: !hasFatalError, value: ast, diagnostics };
  } catch (err) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: "parse-fatal",
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
}

export { tokenizeLines } from "./lexer.js";
export { buildDocuments } from "./builder.js";
export { parseInline } from "@jaroslava/utils";
export type { RawLine } from "./lexer.js";

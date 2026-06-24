import type {
  Diagnostic,
  JaroAst,
  ValidateOptions,
  ValidateResult,
} from "@jaroslava/types";
import type { PluginRegistry } from "@jaroslava/core";
import { walkAst, pathFor } from "@jaroslava/utils";
import { validateAgainstSchema } from "./schema.js";

/**
 * Validates an AST. Belongs to: @jaroslava/validator.
 *
 * Dispatch model:
 *   1. For every ComponentNode, look up its plugin definition in `registry`.
 *      - If found: run its `schema` (generic structural check) and its
 *        `validate` hook (custom cross-field logic), if present.
 *      - If not found: emit a single "unknown-component" warning (already
 *        recorded by the parser, but re-validated here in case the AST was
 *        constructed by hand or migrated without going through parse()).
 *   2. Run every plugin's `globalValidators` once against the whole AST,
 *      for document-wide invariants not scoped to a single node.
 */
export function validate(
  ast: JaroAst,
  registry: PluginRegistry,
  options: ValidateOptions = {},
): ValidateResult {
  const diagnostics: Diagnostic[] = [];

  walkAst(ast, (node, ancestors) => {
    if (node.type !== "Component") return;
    if (options.onlyKinds && !options.onlyKinds.includes(node.kind)) return;

    const path = pathFor(ancestors, node);
    const definition = registry.getComponent(node.kind);

    if (!definition) {
      diagnostics.push({
        severity: "warning",
        code: "unknown-component",
        message: `No plugin registered for component kind "@${node.kind}"; skipping schema validation.`,
        path,
        span: node.span,
      });
      return;
    }

    if (definition.schema) {
      diagnostics.push(...validateAgainstSchema(node, definition.schema, path));
    }
    if (definition.validate) {
      diagnostics.push(...definition.validate(node, { ancestors, path }));
    }

    if (options.failFast && diagnostics.some((d) => d.severity === "error")) {
      return false;
    }
  });

  if (!(options.failFast && diagnostics.some((d) => d.severity === "error"))) {
    for (const globalValidator of registry.listGlobalValidators()) {
      diagnostics.push(...globalValidator(ast));
    }
  }

  const ok = !diagnostics.some((d) => d.severity === "error");
  return { ok, value: ok ? true : undefined, diagnostics };
}

export { validateAgainstSchema } from "./schema.js";

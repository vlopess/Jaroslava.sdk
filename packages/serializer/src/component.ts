import type { AnyNode, ComponentNode, DocumentNode, JaroAttributeValue } from "@jaroslava/types";
import type { PluginRegistry } from "@jaroslava/core";
import { quote } from "@jaroslava/utils";
import { serializeInlineAtom } from "./primitives.js";

export interface SerializeDeps {
  registry: PluginRegistry;
  indentUnit: string;
}

/** Reserved attribute keys the generic serializer treats specially and
 *  never re-emits as plain `key: value` lines (they have dedicated syntax). */
const SPECIAL_ATTR_KEYS = new Set(["_inline"]);

export function serializeNode(node: AnyNode, depth: number, deps: SerializeDeps): string[] {
  switch (node.type) {
    case "Document":
      return serializeComponentLike(node, depth, deps, "page");
    case "Component":
      return serializeComponentLike(node, depth, deps, node.kind);
    default:
      return [`${indent(depth, deps)}${serializeInlineAtom(node)}`];
  }
}

function serializeComponentLike(
  node: DocumentNode | ComponentNode,
  depth: number,
  deps: SerializeDeps,
  kind: string,
): string[] {
  const definition = deps.registry.getComponent(kind);

  if (definition?.serialize) {
    const custom = definition.serialize(node as ComponentNode, {
      indentUnit: deps.indentUnit,
      depth,
      serializeNode: (n, d) => serializeNode(n, d, deps),
    });
    if (custom) return custom;
  }

  const inlineHeader = SPECIAL_ATTR_KEYS.has("_inline") ? (node.attrs._inline as string | undefined) : undefined;
  const header = inlineHeader ? `@${kind} ${inlineHeader}` : `@${kind}`;

  const lines: string[] = [`${indent(depth, deps)}${header}`];

  for (const [key, value] of Object.entries(node.attrs)) {
    if (SPECIAL_ATTR_KEYS.has(key)) continue;
    lines.push(`${indent(depth + 1, deps)}${key}: ${formatAttrValue(value)}`);
  }

  for (const child of node.children) {
    lines.push(...serializeNode(child, depth + 1, deps));
  }

  return lines;
}

function formatAttrValue(value: JaroAttributeValue): string {
  if (typeof value === "string") return quote(value);
  if (Array.isArray(value)) return value.map(formatAttrValue).join(", ");
  if (value && typeof value === "object" && (value as { __call?: boolean }).__call) {
    const call = value as { callee: string; args: JaroAttributeValue[] };
    return `${call.callee}(${call.args.map(formatAttrValue).join(", ")})`;
  }
  return String(value);
}

function indent(depth: number, deps: SerializeDeps): string {
  return deps.indentUnit.repeat(depth);
}

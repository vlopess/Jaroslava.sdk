import type { AnyNode, JaroAst } from "@jaroslava/types";

/** A visitor callback invoked for every node during a walk. Return `false`
 *  to skip descending into that node's children. */
export type Visitor = (node: AnyNode, ancestors: AnyNode[]) => boolean | void;

function childrenOf(node: AnyNode): AnyNode[] {
  switch (node.type) {
    case "Document":
    case "Component":
      return node.children;
    case "InlineGroup":
      return node.items;
    default:
      return [];
  }
}

/** Depth-first traversal over a single node and its descendants. */
export function walk(node: AnyNode, visitor: Visitor, ancestors: AnyNode[] = []): void {
  const goDeeper = visitor(node, ancestors);
  if (goDeeper === false) return;
  const nextAncestors = [...ancestors, node];
  for (const child of childrenOf(node)) {
    walk(child, visitor, nextAncestors);
  }
}

/** Depth-first traversal over every document in an AST. */
export function walkAst(ast: JaroAst, visitor: Visitor): void {
  for (const doc of ast.documents) {
    walk(doc, visitor);
  }
}

/** Collects all nodes matching a predicate across the whole AST. */
export function findAll(ast: JaroAst, predicate: (node: AnyNode) => boolean): AnyNode[] {
  const results: AnyNode[] = [];
  walkAst(ast, (node) => {
    if (predicate(node)) results.push(node);
  });
  return results;
}

/** Finds the first node matching a predicate, or undefined. */
export function findFirst(ast: JaroAst, predicate: (node: AnyNode) => boolean): AnyNode | undefined {
  let found: AnyNode | undefined;
  walkAst(ast, (node) => {
    if (found) return false;
    if (predicate(node)) {
      found = node;
      return false;
    }
  });
  return found;
}

/** Finds a node by its stable `id` field. */
export function findById(ast: JaroAst, id: string): AnyNode | undefined {
  return findFirst(ast, (n) => n.id === id);
}

/** Builds a dotted/bracketed path string for a node, given its ancestor chain
 *  (as produced during `walk`). Useful for diagnostics. */
export function pathFor(ancestors: AnyNode[], node: AnyNode): string {
  const segments: string[] = [];
  let current = node;
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const parent = ancestors[i];
    if (!parent) continue;
    const kids = childrenOf(parent);
    const idx = kids.indexOf(current);
    segments.unshift(`children[${idx}]`);
    current = parent;
  }
  return segments.join(".");
}

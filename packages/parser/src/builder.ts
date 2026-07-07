import type {
  AnyNode,
  CodeBlockNode,
  ComponentNode,
  Diagnostic,
  DocumentNode,
  JaroAttributes,
} from "@jaroslava/types";
import type { PluginRegistry } from "@jaroslava/core";
import { splitKeyValue, unquote, parseInline } from "@jaroslava/utils";
import type { RawLine } from "./lexer.js";

const COMPONENT_RE = /^@(\*|[A-Za-z][A-Za-z0-9_-]*)(?:\(("([^"]*)")\))?(?:\s+(.*))?$/;
//                     @  kind-or-*    (  "literal name"  )           rest-of-line

export interface BuildContext {
  registry: PluginRegistry;
  generateId: () => string;
  diagnostics: Diagnostic[];
  tolerateUnknownComponents: boolean;
}

/**
 * Consumes the full RawLine stream and produces one DocumentNode per
 * `@page` block encountered. Per the language grammar shown in the spec
 * examples, a "page" is not a single nested tree where everything else is
 * indented underneath `@page` — instead, `@page` and the components that
 * belong to it (`@profile`, `@list`, `@hero`, `@grid`, ...) are *siblings*
 * at the same (top, depth-0) indentation level, separated by blank lines.
 * `@page` opens a new page section; every subsequent depth-0 component is
 * appended as a child of that page until the next `@page` line or EOF.
 *
 * A single `.jaro` file may declare several pages back-to-back this way
 * (see the spec's four worked examples, each starting a fresh `@page`).
 */
export function buildDocuments(lines: RawLine[], ctx: BuildContext): DocumentNode[] {
  const documents: DocumentNode[] = [];
  let currentDoc: DocumentNode | undefined;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.depth === 0 && isComponentLine(line.content)) {
      const { node, nextIndex } = buildComponentSubtree(lines, i, ctx);

      if (node.type === "Component" && node.kind === "page") {
        currentDoc = componentToDocument(node, ctx);
        documents.push(currentDoc);
      } else if (currentDoc) {
        currentDoc.children.push(node);
      } else {
        // A depth-0 component appeared before any `@page` — start an
        // implicit anonymous page so the AST invariant (root = pages)
        // still holds and no content is silently dropped.
        currentDoc = componentToDocument(
          {
            id: ctx.generateId(),
            type: "Component",
            kind: "page",
            attrs: {},
            children: [],
          },
          ctx,
        );
        currentDoc.children.push(node);
        documents.push(currentDoc);
      }
      i = nextIndex;
    } else {
      ctx.diagnostics.push({
        severity: "warning",
        code: "unexpected-top-level-line",
        message: `Unexpected content outside of a component at top level: "${line.content}"`,
        span: lineSpan(line),
      });
      i++;
    }
  }
  return documents;
}

function componentToDocument(node: ComponentNode, ctx: BuildContext): DocumentNode {
  return {
    id: node.id,
    type: "Document",
    kind: node.kind,
    attrs: node.attrs,
    children: node.children,
    span: node.span,
  };
}

function isComponentLine(content: string): boolean {
  return COMPONENT_RE.test(content);
}

/**
 * Builds one component node (and recursively its children) starting at
 * `startIndex`, which must point at a component header line. Returns the
 * index of the first line *not* consumed by this subtree.
 */
function buildComponentSubtree(
  lines: RawLine[],
  startIndex: number,
  ctx: BuildContext,
): { node: ComponentNode; nextIndex: number } {
  const header = lines[startIndex]!;
  const match = header.content.match(COMPONENT_RE);
  if (!match) {
    throw new Error(`Internal parser error: expected component header at line ${header.lineNumber}`);
  }
  const [, kindRaw, , literalName, remainder] = match;
  const kind = kindRaw === "*" && literalName ? literalName : (kindRaw ?? "unknown");

  const node: ComponentNode = {
    id: ctx.generateId(),
    type: "Component",
    kind,
    attrs: {},
    children: [],
    span: lineSpan(header),
  };

  const definition = ctx.registry.getComponent(kind);
  if (!definition) {
    ctx.diagnostics.push({
      severity: ctx.tolerateUnknownComponents ? "warning" : "error",
      code: "unknown-component",
      message: `Unknown component "@${kind}" — no plugin registered this kind. It will be kept in the AST as a generic component.`,
      span: lineSpan(header),
    });
  }

  if (remainder && remainder.trim().length > 0) {
    const hooked = definition?.parse?.parseInlineHeader?.(remainder.trim());
    if (hooked) {
      Object.assign(node.attrs, hooked);
    } else {
      // Generic fallback: treat the remainder as a single `lang`-style
      // positional attribute named "_inline" so no information is lost.
      node.attrs._inline = remainder.trim();
    }
  }

  const bodyDepth = header.depth + 1;
  let i = startIndex + 1;

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.depth < bodyDepth) break;
    if (line.depth > bodyDepth) {
      // Should not normally happen (would mean a skipped depth level);
      // treat as belonging to the previous child for resilience.
      i++;
      continue;
    }
    if(i > 47) {
      console.log("");
    }

    if (isComponentLine(line.content) && kind !== "code") {
      const child = buildComponentSubtree(lines, i, ctx);
      node.children.push(child.node);
      i = child.nextIndex;
      continue;
    }

    // Special handling for @code: everything indented under it is raw,
    // verbatim code, not further parsed as attrs/prose/components.
    if (node.kind === "code" && line.depth === bodyDepth) {
      const codeNode = consumeCodeBlock(lines, i, bodyDepth, ctx);
      node.children.push(codeNode.node);
      i = codeNode.nextIndex;
      continue;
    }

    // Let a plugin claim this line for custom row syntax (e.g. @list rows).
    const customNode = definition?.parse?.parseBodyLine?.(line.content, {
      depth: line.depth,
      lineNumber: line.lineNumber,
      generateId: ctx.generateId,
    });
    if (customNode) {
      node.children.push(customNode);
      i++;
      continue;
    }

    const kv = splitKeyValue(line.content);
    if (kv && looksLikeAttributeKey(kv.key)) {
      node.attrs[kv.key] = coerceAttrValue(kv.value);
      i++;
      continue;
    }

    // Otherwise: prose / inline content line.
    const inlineNode = parseInline(line.content, {
      generateId: ctx.generateId,
    });
    node.children.push(inlineNode);
    i++;
  }

  return { node, nextIndex: i };
}

function consumeCodeBlock(
  lines: RawLine[],
  startIndex: number,
  bodyDepth: number,
  ctx: BuildContext,
): { node: CodeBlockNode; nextIndex: number } {
  const codeLines: string[] = [];
  let i = startIndex;
  const language =
    typeof ctxLanguageHintFor(lines, startIndex - 1) === "string"
      ? ctxLanguageHintFor(lines, startIndex - 1)
      : undefined;
  while (i < lines.length && lines[i]!.depth >= bodyDepth) {
    codeLines.push("  ".repeat(lines[i]!.depth - 1) + lines[i]!.content);
    i++;
  }
  const node: CodeBlockNode = {
    id: ctx.generateId(),
    type: "CodeBlock",
    language,
    code: codeLines.join("\n"),
  };
  return { node, nextIndex: i };
}

function ctxLanguageHintFor(lines: RawLine[], headerIndex: number): string | undefined {
  const header = lines[headerIndex];
  if (!header) return undefined;
  const match = header.content.match(/^@code\s+(\S+)$/);
  return match?.[1];
}


/**
 * An attribute line's key must look like a single identifier-style token
 * (letters/digits/underscore/hyphen, no internal spaces) — e.g. `title`,
 * `avatar`, `description`. Prose lines that happen to contain a colon
 * (e.g. "Install Jaroslava with one command:") have a multi-word "key"
 * ("Install Jaroslava with one command") which can never be a valid
 * attribute name, so they correctly fall through to inline/prose parsing.
 */
const ATTRIBUTE_KEY_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;

function looksLikeAttributeKey(key: string): boolean {
  return ATTRIBUTE_KEY_RE.test(key);
}

const ATTR_CALL_RE = /^([A-Za-z_][A-Za-z0-9_]*)\(([^)]*)\)$/;

/**
 * Coerces a raw attribute value string into a JaroAttributeValue.
 *
 * Notably, this does NOT blindly split every comma-containing string into
 * an array — `description: UX, Fintech, Web` is free-text prose for one
 * component (@card) but `tags: UX, Psychology` is meant to be a list for
 * another (@post). That distinction depends on the component's schema,
 * which the generic parser does not have access to at this layer. The
 * parser therefore stores comma-bearing values as a plain string by
 * default; a component's `parseInlineHeader`/`parseBodyLine` hook, or a
 * dedicated array-coercion step in @jaroslava/validator using the
 * registered ComponentSchema, is the correct place to split fields that
 * are schema-declared as `type: "array"`. This keeps the parser itself
 * free of per-component assumptions, per the plugin-driven architecture.
 *
 * Call-expression syntax (`img("finflow.jpg")`) IS handled here, though,
 * since that is a language-level construct (see @jaroslava/types' CallNode)
 * rather than a component-specific convention — any attribute value using
 * `name(args)` syntax is parsed into the same shape a CallNode would carry,
 * so renderers (e.g. @card's `cover`) can read `.callee` / `.args` instead
 * of re-parsing a string.
 */
function coerceAttrValue(raw: string): JaroAttributes[string] {
  if (raw.startsWith('"')) return unquote(raw);
  if (raw === "true") return true;
  if (raw === "false") return false;

  const callMatch = raw.match(ATTR_CALL_RE);
  if (callMatch) {
    const [, callee, argsRaw] = callMatch;
    return {
      __call: true,
      callee: callee ?? "",
      args: parseCallArgs(argsRaw ?? ""),
    };
  }

  const num = Number(raw);
  if (!Number.isNaN(num) && raw !== "") return num;
  return raw;
}

function parseCallArgs(raw: string): JaroAttributes[string][] {
  if (raw.trim().length === 0) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .map((part) => coerceAttrValue(part));
}

function lineSpan(line: RawLine) {
  return {
    startLine: line.lineNumber,
    startColumn: line.indentWidthSpaces + 1,
    endLine: line.lineNumber,
    endColumn: line.raw.length + 1,
  };
}

export type { AnyNode };

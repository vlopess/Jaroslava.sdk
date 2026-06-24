/**
 * ============================================================================
 * Jaroslava AST — Node Definitions
 * ============================================================================
 *
 * The AST is the single source of truth of the entire Jaroslava ecosystem.
 * It is intentionally *generic*: the schema itself has no knowledge of
 * `@page`, `@hero`, `@card`, etc. Those are component *kinds* contributed by
 * plugins (see `plugin.ts`). This file defines only the shape that every
 * node — built-in or third-party — must conform to.
 *
 * Design goals:
 *  - Serializable to/from JSON (no class instances, no functions, no cycles).
 *  - Stable across language versions via `astVersion` + node-level `version`.
 *  - Walkable generically (renderers/validators never need a switch over
 *    every possible component kind — they dispatch through the plugin
 *    registry instead, see @jaroslava/core).
 */

/** Semver-ish string identifying the AST schema shape itself. */
export type AstSchemaVersion = string;

/**
 * A source location, used for diagnostics, source maps, and round-trip
 * fidelity (e.g. preserving blank lines / comments where possible).
 * Optional everywhere a node can also be constructed programmatically
 * (e.g. by an editor or a codegen tool) without a real source file.
 */
export interface SourceSpan {
  /** 1-based line number where the node starts. */
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  /** Byte/char offsets into the original source, if available. */
  startOffset?: number;
  endOffset?: number;
}

/**
 * Primitive attribute value types supported by the language.
 * Kept intentionally small & JSON-safe.
 */
/**
 * Marker shape produced when an attribute's raw value uses call-expression
 * syntax, e.g. `cover: img("finflow.jpg")`. Distinguished from a plain
 * object via the `__call` discriminant so consumers can `if (value.__call)`
 * narrow safely instead of guessing based on which keys are present.
 */
export interface JaroAttributeCallValue {
  __call: true;
  callee: string;
  args: JaroAttributeValue[];
}

export type JaroAttributeValue =
  | string
  | number
  | boolean
  | null
  | JaroAttributeCallValue
  | JaroAttributeValue[]
  | { [key: string]: JaroAttributeValue };

/** Ordered map of attribute name -> value, e.g. `title: "Sarah Okonkwo"`. */
export type JaroAttributes = Record<string, JaroAttributeValue>;

/**
 * Discriminates the structural role of a node, independent of *which*
 * component it is. This is what generic tooling (validator core, renderer
 * core, serializer core) switches on; the specific `kind` (e.g. "page",
 * "hero", "card") is resolved through the plugin/component registry.
 */
export type JaroNodeType =
  /** The root of a single page/document. Always exactly one per AST root entry. */
  | "Document"
  /** A block-level component instance, e.g. @page, @hero, @card, @list. */
  | "Component"
  /** Plain text content inside a component (paragraphs, prose lines). */
  | "Text"
  /** A link expression: `-> "url"` or `Label -> "url"`. */
  | "Link"
  /** An inline call expression like img("link.com") or @("name"). */
  | "Call"
  /** A code block, e.g. `@code bash`. Modeled as a distinct type because
   *  its content is raw/verbatim rather than parsed prose or children. */
  | "CodeBlock"
  /** Generic inline container used for `+`-joined element groups,
   *  e.g. `img("link.com") + Portfolio`. */
  | "InlineGroup";

/**
 * Base interface shared by every AST node, regardless of type or kind.
 */
export interface BaseNode {
  /** Stable, unique identifier for this node within the AST (UUID v4 or ULID). */
  id: string;
  type: JaroNodeType;
  /**
   * Schema version this individual node conforms to. Normally equal to the
   * document's astVersion, but kept per-node so that partial migrations
   * (e.g. a copy-pasted node from an older doc) remain detectable.
   */
  version: AstSchemaVersion;
  span?: SourceSpan;
  /**
   * Free-form bag for plugin- or tool-specific metadata that should NOT
   * affect rendering/serialization semantics (e.g. editor selection state,
   * collaborative-editing cursors, analytics tags). Renderers and the
   * serializer must ignore unknown meta keys.
   */
  meta?: Record<string, unknown>;
}

/**
 * The root node of one Jaroslava document (one `.jaro` file == one
 * `@page` block stream == one DocumentNode, by convention; see
 * `JaroAst.documents` below for multi-page files such as the examples
 * in the spec, which concatenate several @page blocks in one file).
 */
export interface DocumentNode extends BaseNode {
  type: "Document";
  /** Always "page" by current convention, but resolved via registry, not hardcoded. */
  kind: string;
  attrs: JaroAttributes;
  children: AnyNode[];
}

/**
 * A component instance — the workhorse node. `kind` is the lowercase
 * component name as declared by a plugin (e.g. "hero", "card", "list",
 * "profile", "sidebar", or any third-party kind such "testimonial").
 * The AST/core packages never enumerate these kinds; only the active
 * ComponentPlugin registry knows what a given `kind` means.
 */
export interface ComponentNode extends BaseNode {
  type: "Component";
  kind: string;
  attrs: JaroAttributes;
  children: AnyNode[];
}

export interface TextNode extends BaseNode {
  type: "Text";
  value: string;
}

export interface LinkNode extends BaseNode {
  type: "Link";
  /** Optional label, e.g. the `Portfolio` in `img(...) + Portfolio -> "..."`. */
  label?: string;
  href: string;
  /** True when href starts with `id:` (internal anchor, e.g. `id:started`). */
  internal: boolean;
}

export interface CallNode extends BaseNode {
  type: "Call";
  /** Callee name, e.g. "img" or the component name inside `@("name")`. */
  callee: string;
  args: JaroAttributeValue[];
}

export interface CodeBlockNode extends BaseNode {
  type: "CodeBlock";
  /** Optional language tag, e.g. "bash". Undefined means plain/unspecified. */
  language?: string;
  code: string;
}

export interface InlineGroupNode extends BaseNode {
  type: "InlineGroup";
  /** The `+`-joined sequence of inline nodes (Call, Text, Link, ...). */
  items: AnyNode[];
}

export type AnyNode =
  | DocumentNode
  | ComponentNode
  | TextNode
  | LinkNode
  | CallNode
  | CodeBlockNode
  | InlineGroupNode;

/**
 * The full AST produced by the parser for one `.jaro` source file.
 * A single file may contain multiple `@page` blocks (see spec examples),
 * so the root holds an ordered list of DocumentNodes rather than one.
 */
export interface JaroAst {
  astVersion: AstSchemaVersion;
  /** Identifier for the language/grammar version the source was parsed with. */
  languageVersion: string;
  documents: DocumentNode[];
  /** Non-fatal issues collected during parsing (unknown components, etc). */
  diagnostics: Diagnostic[];
}

/** Severity levels used across parsing, validation, and rendering diagnostics. */
export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  severity: DiagnosticSeverity;
  /** Stable machine-readable code, e.g. "unknown-component", "missing-attr". */
  code: string;
  message: string;
  span?: SourceSpan;
  /** Dotted path to the offending node, e.g. "documents[0].children[2]". */
  path?: string;
}

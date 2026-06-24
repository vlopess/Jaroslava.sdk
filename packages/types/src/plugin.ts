/**
 * ============================================================================
 * Jaroslava Plugin Contracts
 * ============================================================================
 *
 * Every component in the language — `@page`, `@list`, `@hero`, `@card`,
 * `@code`, custom user components declared via `@("name")`, and any future
 * third-party component — is registered through these contracts. Nothing
 * about a specific component is hardcoded into core/parser/validator/
 * renderer-html. Those packages only know how to:
 *
 *   1. ask the registry "do you have a plugin for kind X?"
 *   2. delegate parsing/validation/rendering of that node to the plugin
 *   3. fall back to a generic/unknown-component handler if not found
 *
 * The "built-in" components described in the spec (@page, @profile, @list,
 * @post, @hero, @grid, @card, @sidebar, @code, etc.) are shipped as an
 * ordinary plugin package: `@jaroslava/plugin-core-components`. They have
 * no special privileges over a third-party plugin.
 */

import type {
  AnyNode,
  ComponentNode,
  Diagnostic,
  JaroAttributes,
} from "./ast.js";

/**
 * Describes the *shape* a component's attributes/children are expected to
 * have, expressed as a JSON-Schema-like structure understood by
 * @jaroslava/validator. Kept deliberately small (not a full JSON Schema
 * implementation) so plugin authors can write these by hand.
 */
export interface AttributeSchema {
  type: "string" | "number" | "boolean" | "enum" | "array" | "object";
  /** Required only when type === "enum". */
  enumValues?: string[];
  required?: boolean;
  description?: string;
}

export interface ComponentSchema {
  /** Lowercase kind name this schema describes, e.g. "hero". */
  kind: string;
  attributes?: Record<string, AttributeSchema>;
  /** Which structural node types are allowed as direct children. Omit = any. */
  allowedChildren?: AnyNode["type"][];
  /** Which component kinds are allowed as direct children, if type is "Component". */
  allowedChildKinds?: string[];
  /** Maximum nesting depth for this component within itself, if relevant. */
  maxDepth?: number;
}

/**
 * Parsing-side hook. Most components don't need this — the generic parser
 * already turns `@kind\n  attr: value\n  ...children` into a ComponentNode.
 * Implement `parseAttributes` only when a component needs custom inline
 * syntax (e.g. @code's `bash` language tag right after the keyword, or
 * @list's special `img(...) + Label -> "url"` row grammar).
 */
export interface ComponentParseHooks {
  /**
   * Called with the raw inline remainder of the component's opening line
   * (everything after `@kind`, before the indented body), e.g. for
   * `@code bash` this receives `"bash"`.
   * Return attrs to merge into the node, or undefined to use defaults.
   */
  parseInlineHeader?(remainder: string): JaroAttributes | undefined;

  /**
   * Called once per raw indented body line belonging to this component,
   * *before* the generic attribute/text parser runs, allowing a plugin to
   * claim and custom-parse lines with special syntax (like @list's rows).
   * Return `null` to let the generic parser handle the line normally.
   */
  parseBodyLine?(line: string, ctx: ParseLineContext): AnyNode | null;
}

export interface ParseLineContext {
  /** Indentation depth of the line, in indent units (not raw spaces). */
  depth: number;
  lineNumber: number;
  generateId: () => string;
}

/**
 * Validation-side hook for logic a static schema can't express, e.g.
 * "@card inside @grid must have a `cover`" or cross-field constraints.
 */
export interface ComponentValidateHook {
  (node: ComponentNode, ctx: ValidateContext): Diagnostic[];
}

export interface ValidateContext {
  /** Ancestor chain from root to this node's direct parent. */
  ancestors: AnyNode[];
  path: string;
}

/**
 * Rendering-side hook: turn a ComponentNode (plus its already-rendered
 * children) into HTML. Plugins receive children pre-rendered so they
 * don't need to know how to render arbitrary nested kinds themselves.
 */
export interface ComponentRenderHook {
  (node: ComponentNode, renderedChildren: string, ctx: RenderContext): RenderOutput;
}

export interface RenderContext {
  /** Theme value resolved from the nearest ancestor @page, if any. */
  theme?: string;
  /** Arbitrary render-time options passed through from renderHtml(). */
  options: Record<string, unknown>;
  /** Recursively render an arbitrary child node (for advanced plugins that
   *  need control over child rendering order, e.g. @grid laying out @card). */
  renderNode: (node: AnyNode) => RenderOutput;
}

export interface RenderOutput {
  html: string;
  /** CSS fragments this render contributed; deduped & merged by the renderer core. */
  css?: string[];
  /** Additional <head> tags (fonts, meta), merged & deduped by renderer core. */
  head?: string[];
}

/**
 * Serialization-side hook: turn a ComponentNode back into `.jaro` source
 * lines. Optional — the generic serializer can round-trip any component
 * built purely from standard attrs/children. Only implement this for
 * components with custom inline syntax (mirrors ComponentParseHooks).
 */
export interface ComponentSerializeHook {
  (node: ComponentNode, ctx: SerializeContext): string[] | undefined;
}

export interface SerializeContext {
  indentUnit: string;
  depth: number;
  serializeNode: (node: AnyNode, depth: number) => string[];
}

/**
 * A complete component contribution. One plugin package (e.g.
 * @jaroslava/plugin-core-components) typically exports an array of these.
 */
export interface ComponentDefinition {
  /** Lowercase kind, matched against `@kind` in source, e.g. "hero". */
  kind: string;
  /** Human-readable name for editor UIs / docs. */
  displayName: string;
  schema?: ComponentSchema;
  parse?: ComponentParseHooks;
  validate?: ComponentValidateHook;
  render?: ComponentRenderHook;
  serialize?: ComponentSerializeHook;
}

/**
 * Top-level plugin object. A plugin may contribute components, generic
 * validators (not tied to one kind, e.g. "every page must have a title"),
 * and/or a totally custom renderer target (not just HTML).
 */
export interface JaroslavaPlugin {
  /** npm-package-style unique name, e.g. "@jaroslava/plugin-core-components". */
  name: string;
  version: string;
  components?: ComponentDefinition[];
  /** Document- or AST-wide validators not scoped to a single component kind. */
  globalValidators?: GlobalValidator[];
  /**
   * Called once when the plugin is registered into a PluginRegistry.
   * Useful for plugins that need setup (e.g. registering fonts, loading
   * remote schemas) before parse/validate/render calls occur.
   */
  setup?(registry: PluginRegistryLike): void | Promise<void>;
}

export interface GlobalValidator {
  name: string;
  (ast: import("./ast.js").JaroAst): Diagnostic[];
}

/**
 * Minimal surface a plugin's `setup()` can rely on, kept separate from the
 * concrete PluginRegistry class (which lives in @jaroslava/core) so that
 * @jaroslava/types has zero runtime dependencies on other packages.
 */
export interface PluginRegistryLike {
  getComponent(kind: string): ComponentDefinition | undefined;
  registerComponent(def: ComponentDefinition): void;
}

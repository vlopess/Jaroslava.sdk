/**
 * Shared cross-package result and option types. Kept separate from ast.ts
 * and plugin.ts so each file stays focused on one concern.
 */

import type { Diagnostic, JaroAst } from "./ast.js";

/** Generic wrapper returned by operations that can partially fail. */
export interface Result<T> {
  ok: boolean;
  value?: T;
  diagnostics: Diagnostic[];
}

export interface ParseOptions {
  /** Language/grammar version to parse against. Defaults to latest known. */
  languageVersion?: string;
  /** Indentation unit width in spaces, used for diagnostics only (parser tolerates both). */
  indentSize?: number;
  /** When true, unknown components produce a warning instead of an error and
   *  are kept in the AST as a generic ComponentNode (kind preserved as-is). */
  tolerateUnknownComponents?: boolean;
}

export interface SerializeOptions {
  indentUnit?: string;
  /** Insert a blank line between top-level components. Defaults to true. */
  blankLineBetweenComponents?: boolean;
}

export interface ValidateOptions {
  /** Stop at first error rather than collecting all diagnostics. */
  failFast?: boolean;
  /** Only run validators for these component kinds; omit = run all. */
  onlyKinds?: string[];
}

export interface RenderHtmlOptions {
  /** Inline <style> vs separate stylesheet output. */
  cssOutput?: "inline" | "separate";
  /** Arbitrary options forwarded to ComponentRenderHook implementations. */
  pluginOptions?: Record<string, unknown>;
  /** Pretty-print the output HTML. Defaults to true. */
  pretty?: boolean;
}

export interface RenderHtmlResult {
  /** One HTML document string per DocumentNode in the AST. */
  pages: { html: string; css: string }[];
}

export type ParseResult = Result<JaroAst>;
export type ValidateResult = Result<true>;
export type SerializeResult = Result<string>;

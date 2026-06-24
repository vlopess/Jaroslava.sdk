import { JaroslavaContext, type JaroslavaContextOptions } from "@jaroslava/core";
import { parse as parseLowLevel } from "@jaroslava/parser";
import { serialize as serializeLowLevel } from "@jaroslava/serializer";
import { validate as validateLowLevel } from "@jaroslava/validator";
import { renderHtml as renderHtmlLowLevel } from "@jaroslava/renderer-html";
import type {
  JaroAst,
  ParseOptions,
  ParseResult,
  RenderHtmlOptions,
  RenderHtmlResult,
  SerializeOptions,
  SerializeResult,
  ValidateOptions,
  ValidateResult,
  JaroslavaPlugin,
} from "@jaroslava/types";

/**
 * `Jaroslava` is the top-level facade most applications will use. It owns
 * one `JaroslavaContext` (i.e. one PluginRegistry) and exposes the four
 * public operations described in the architecture spec — `parse`,
 * `serialize`, `validate`, `renderHtml` — as instance methods so plugins
 * only need to be registered once.
 *
 * Each underlying operation is also exported as a free function (see
 * below) for callers who want to manage their own PluginRegistry/Context
 * explicitly — e.g. a multi-tenant server that needs one registry per
 * request with different plugin sets.
 */
export class Jaroslava {
  private constructor(private readonly context: JaroslavaContext) {}

  static async create(options: JaroslavaContextOptions = {}): Promise<Jaroslava> {
    const context = await JaroslavaContext.create(options);
    return new Jaroslava(context);
  }

  async use(plugin: JaroslavaPlugin): Promise<this> {
    await this.context.use(plugin);
    return this;
  }

  /** Package: @jaroslava/parser */
  parse(source: string, options?: ParseOptions): ParseResult {
    return parseLowLevel(source, this.context.registry, options);
  }

  /** Package: @jaroslava/serializer */
  serialize(ast: JaroAst, options?: SerializeOptions): SerializeResult {
    return serializeLowLevel(ast, this.context.registry, options);
  }

  /** Package: @jaroslava/validator */
  validate(ast: JaroAst, options?: ValidateOptions): ValidateResult {
    return validateLowLevel(ast, this.context.registry, options);
  }

  /** Package: @jaroslava/renderer-html */
  renderHtml(ast: JaroAst, options?: RenderHtmlOptions): RenderHtmlResult {
    return renderHtmlLowLevel(ast, this.context.registry, options);
  }

  get registry() {
    return this.context.registry;
  }
}

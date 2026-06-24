import type { JaroslavaPlugin } from "@jaroslava/types";
import { PluginRegistry, createRegistry } from "./registry.js";

export interface JaroslavaContextOptions {
  /** Plugins to install eagerly. Order matters for override resolution. */
  plugins?: JaroslavaPlugin[];
  /** Provide an existing registry instead of creating a new one (advanced). */
  registry?: PluginRegistry;
}

/**
 * `JaroslavaContext` is the object applications construct once and pass
 * into parser/validator/renderer-html calls. It owns the PluginRegistry
 * and exists so consumers don't need to manually wire plugin installation
 * before every parse/render call.
 *
 * Note: @jaroslava/core ships with NO built-in plugins installed by
 * default. Consumers who want the standard component set explicitly add
 * `@jaroslava/plugin-core-components` — this keeps the dependency graph
 * honest (core does not secretly depend on "core components").
 */
export class JaroslavaContext {
  readonly registry: PluginRegistry;

  private constructor(registry: PluginRegistry) {
    this.registry = registry;
  }

  static async create(options: JaroslavaContextOptions = {}): Promise<JaroslavaContext> {
    const registry = options.registry ?? createRegistry();
    const ctx = new JaroslavaContext(registry);
    for (const plugin of options.plugins ?? []) {
      await registry.install(plugin);
    }
    return ctx;
  }

  async use(plugin: JaroslavaPlugin): Promise<this> {
    await this.registry.install(plugin);
    return this;
  }
}

export { PluginRegistry, createRegistry, DuplicateComponentError } from "./registry.js";

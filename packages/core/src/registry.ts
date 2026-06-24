import type {
  ComponentDefinition,
  GlobalValidator,
  JaroslavaPlugin,
  PluginRegistryLike,
} from "@jaroslava/types";

/**
 * Thrown when two plugins attempt to register the same component `kind`
 * without explicit override permission. Kept as a distinct class so
 * consumers (e.g. an editor UI) can catch it and surface a clear message
 * instead of a generic Error.
 */
export class DuplicateComponentError extends Error {
  constructor(public readonly kind: string, public readonly existingPlugin: string) {
    super(
      `Component kind "${kind}" is already registered by plugin "${existingPlugin}". ` +
        `Pass { override: true } to registerComponent if this is intentional.`,
    );
    this.name = "DuplicateComponentError";
  }
}

interface RegisteredComponent {
  definition: ComponentDefinition;
  pluginName: string;
}

export interface RegisterComponentOptions {
  /** Allow silently replacing a component already registered by another plugin. */
  override?: boolean;
}

/**
 * The PluginRegistry is the single place that knows "what components
 * exist". Parser, validator, and renderer-html each receive a registry
 * instance and dispatch to it — they contain zero hardcoded component
 * names. The bundled "core components" (@page, @hero, @card, ...) are
 * registered into this exact same registry via an ordinary plugin
 * (@jaroslava/plugin-core-components), with no special-cased path.
 */
export class PluginRegistry implements PluginRegistryLike {
  private components = new Map<string, RegisteredComponent>();
  private globalValidators: { validator: GlobalValidator; pluginName: string }[] = [];
  private installedPlugins = new Map<string, JaroslavaPlugin>();

  /** Registers a single component definition under a given owning plugin name. */
  registerComponent(
    definition: ComponentDefinition,
    pluginName = "anonymous",
    options: RegisterComponentOptions = {},
  ): void {
    const kind = definition.kind.toLowerCase();
    const existing = this.components.get(kind);
    if (existing && !options.override) {
      throw new DuplicateComponentError(kind, existing.pluginName);
    }
    this.components.set(kind, { definition, pluginName });
  }

  getComponent(kind: string): ComponentDefinition | undefined {
    return this.components.get(kind.toLowerCase())?.definition;
  }

  hasComponent(kind: string): boolean {
    return this.components.has(kind.toLowerCase());
  }

  listComponents(): ComponentDefinition[] {
    return Array.from(this.components.values()).map((c) => c.definition);
  }

  unregisterComponent(kind: string): void {
    this.components.delete(kind.toLowerCase());
  }

  registerGlobalValidator(validator: GlobalValidator, pluginName = "anonymous"): void {
    this.globalValidators.push({ validator, pluginName });
  }

  listGlobalValidators(): GlobalValidator[] {
    return this.globalValidators.map((v) => v.validator);
  }

  /**
   * Installs a full plugin: registers all its components and global
   * validators, then invokes its `setup` lifecycle hook if present.
   * Idempotent per plugin name — installing the same plugin name twice
   * throws unless `options.override` is set, to catch accidental
   * double-installs of the same dependency by two different packages.
   */
  async install(plugin: JaroslavaPlugin, options: RegisterComponentOptions = {}): Promise<void> {
    if (this.installedPlugins.has(plugin.name) && !options.override) {
      throw new Error(
        `Plugin "${plugin.name}" is already installed. Pass { override: true } to reinstall.`,
      );
    }
    for (const component of plugin.components ?? []) {
      this.registerComponent(component, plugin.name, options);
    }
    for (const validator of plugin.globalValidators ?? []) {
      this.registerGlobalValidator(validator, plugin.name);
    }
    this.installedPlugins.set(plugin.name, plugin);
    await plugin.setup?.(this);
  }

  listInstalledPlugins(): JaroslavaPlugin[] {
    return Array.from(this.installedPlugins.values());
  }

  /** Creates an independent copy with the same registrations — useful for
   *  sandboxing per-request plugin sets (e.g. in a multi-tenant SSR server). */
  clone(): PluginRegistry {
    const next = new PluginRegistry();
    for (const [kind, entry] of this.components) {
      next.components.set(kind, entry);
    }
    next.globalValidators = [...this.globalValidators];
    next.installedPlugins = new Map(this.installedPlugins);
    return next;
  }
}

/** Convenience factory for a fresh, empty registry. */
export function createRegistry(): PluginRegistry {
  return new PluginRegistry();
}

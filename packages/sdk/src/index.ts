export { Jaroslava } from "./jaroslava.js";

export * from "@jaroslava/types";
export { PluginRegistry, JaroslavaContext, createRegistry, CURRENT_AST_VERSION, CURRENT_LANGUAGE_VERSION } from "@jaroslava/core";
export { parse } from "@jaroslava/parser";
export { serialize } from "@jaroslava/serializer";
export { validate } from "@jaroslava/validator";
export { renderHtml } from "@jaroslava/renderer-html";
export { coreComponentsPlugin } from "@jaroslava/plugin-core-components";

import { Jaroslava } from "./jaroslava.js";
import { coreComponentsPlugin } from "@jaroslava/plugin-core-components";

export async function createDefaultSdk(extraPlugins: import("@jaroslava/types").JaroslavaPlugin[] = []) {
  return Jaroslava.create({ plugins: [coreComponentsPlugin, ...extraPlugins] });
}

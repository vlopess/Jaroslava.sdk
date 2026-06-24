import type { JaroslavaPlugin } from "@jaroslava/types";
import { pageComponent } from "./components/page.js";
import { profileComponent } from "./components/profile.js";
import { listComponent } from "./components/list.js";
import { postComponent } from "./components/post.js";
import { heroComponent } from "./components/hero.js";
import { gridComponent, cardComponent } from "./components/grid-and-card.js";
import { sidebarComponent } from "./components/sidebar.js";
import { codeComponent } from "./components/code.js";

/**
 * The standard Jaroslava component set, packaged as an ordinary plugin.
 * Consumers opt in explicitly:
 *
 *   import { coreComponentsPlugin } from "@jaroslava/plugin-core-components";
 *   const ctx = await JaroslavaContext.create({ plugins: [coreComponentsPlugin] });
 *
 * Nothing in @jaroslava/core, @jaroslava/parser, @jaroslava/validator, or
 * @jaroslava/renderer-html imports this package. A third-party plugin
 * (e.g. @acme/jaroslava-plugin-testimonial) is installed exactly the same
 * way and has equal standing in the registry.
 */
export const coreComponentsPlugin: JaroslavaPlugin = {
  name: "@jaroslava/plugin-core-components",
  version: "0.1.0",
  components: [
    pageComponent,
    profileComponent,
    listComponent,
    postComponent,
    heroComponent,
    gridComponent,
    cardComponent,
    sidebarComponent,
    codeComponent,
  ],
};

export {
  pageComponent,
  profileComponent,
  listComponent,
  postComponent,
  heroComponent,
  gridComponent,
  cardComponent,
  sidebarComponent,
  codeComponent,
};

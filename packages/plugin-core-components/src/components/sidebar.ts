import type { ComponentDefinition, LinkNode } from "@jaroslava/types";

export const sidebarComponent: ComponentDefinition = {
  kind: "sidebar",
  displayName: "Sidebar",
  render(node, _renderedChildren, ctx) {
    const items = node.children
      .filter((c): c is LinkNode => c.type === "Link")
      .map((link) => {
        const href = link.internal ? `#${link.href.replace(/^id:/, "")}` : link.href;
        return `  <li><a href="${href}">${link.label ?? href}</a></li>`;
      })
      .join("\n");
    return {
      html: `<nav class="jaro-sidebar">\n<ul>\n${items}\n</ul>\n</nav>`,
      css: [".jaro-sidebar ul { list-style: none; padding: 0; }"],
    };
  },
};

import type { ComponentDefinition, LinkNode } from "@jaroslava/types";

export const sidebarComponent: ComponentDefinition = {
  kind: "sidebar",
  displayName: "Sidebar",
  render(node, _renderedChildren, ctx) {
    const items = node.children
      .filter((c): c is LinkNode => c.type === "Link")
      .map((link, index) => {
        const href = link.internal ? `#${link.href.replace(/^id:/, "")}` : link.href;
        return `  <div class="jaro-sidebar-item"><a href="${href}">${link.label ?? href}</a></div>`;
      })
      .join("\n");
    return {
      html: `<div class="jaro-sidebar">\n
        <div class="jaro-sidebar-label">Docs</div>
        <div class="jaro-sidebar-list">
          ${items}
        </div>
      </div>`,
      css: [
        ".jaro-sidebar { border-right: 0.5px solid var(--line); padding-right: 0.75rem; }",
        ".jaro-sidebar-label {font-size: 0.68rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1.6rem; font-family: 'Space Grotesk', sans-serif;}",
        ".jaro-sidebar-list {display: flex; flex-direction: column; gap: 1rem;}",
        ".jaro-sidebar-item {font-size: 0.75rem; color: #444;}",
        "a {font-size: 0.75rem; color: #444; text-decoration: none;}",
        ".active > a, a:hover {font-weight: 500; color: var(--jaro)}",
      ],
      head: [
        `<script>
          document.addEventListener("DOMContentLoaded", () => {
              const heroes = document.querySelectorAll(".jaro-hero");
              const items = document.querySelectorAll(".jaro-sidebar-item");
              const links = document.querySelectorAll('.jaro-sidebar a[href^="#"]');

              heroes.forEach(hero => {
                  hero.style.display = "none";
              });

              if (heroes.length > 0) {                
                  heroes[0].style.display = "";
                  items[0].classList.add("active");
              }

              links.forEach(link => {
                  link.addEventListener("click", e => {
                      e.preventDefault();

                      const id = link.getAttribute("href").substring(1);
                      const hero = document.getElementById(id);

                      if (hero) {
                        heroes.forEach(hero => {
                          hero.style.display = "none";
                        });
                            
                        items.forEach(item => {                            
                          item.classList.remove("active");
                        });


                        hero.style.display = "";
                        link.parentNode.classList.add("active");
                      }
                  });
              });
          });
          </script>`
      ]
    };
  },
};

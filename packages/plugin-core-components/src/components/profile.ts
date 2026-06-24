import type { ComponentDefinition } from "@jaroslava/types";

export const profileComponent: ComponentDefinition = {
  kind: "profile",
  displayName: "Profile",
  schema: {
    kind: "profile",
    attributes: {
      name: { type: "string", required: true },
      role: { type: "string", required: false },
      avatar: { type: "string", required: false },
    },
  },
  render(node) {
    const name = String(node.attrs.name ?? "");
    const role = String(node.attrs.role ?? "");
    const avatar = String(node.attrs.avatar ?? "");
    const html = [
      `<section class="jaro-profile">`,
      avatar ? `  <img class="jaro-avatar" src="${avatar}" alt="${name}" />` : "",
      `  <h1 class="jaro-profile-name">${name}</h1>`,
      role ? `  <p class="jaro-profile-role">${role}</p>` : "",
      `</section>`,
    ]
      .filter(Boolean)
      .join("\n");
    return {
      html,
      css: [
        ".jaro-avatar { border-radius: 50%; width: 96px; height: 96px; object-fit: cover; }",
      ],
    };
  },
};

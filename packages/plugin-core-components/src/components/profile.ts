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
      avatar
        ? `  <img class="jaro-avatar" src="${avatar}" alt="${name}" />`
        : `  <div class="jaro-avatar">${getInitials(name)}</div>`,
      `  <h1 class="jaro-profile-name">${name}</h1>`,
      role ? `  <p class="jaro-profile-role">${role}</p>` : "",
      `</section>`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      html,
      css: [
        ".jaro-profile { display:flex; flex-direction:column; align-items:center; text-align:center; padding:4rem 1.5rem; }",
        ".jaro-avatar { display: flex; justify-content: center; align-items: center; width:88px; height:88px; border-radius:50%; object-fit:cover; border:2px solid var(--line); margin-bottom:1.5rem; color: white; font-size: xx-large;}",
        ".jaro-profile-name { margin:0; font-size:2rem; font-weight:400; line-height:1.2; color:var(--jaro-text,#fff); }",
        ".jaro-profile-role { margin-top:0.5rem; margin-bottom:0; font-size:0.875rem; color:var(--muted); letter-spacing:0.08em; }",
      ]
    };
  }
};

export function getInitials(value: string) {
  if(value.trim() === "") return "";
  return value.split(" ").map((n) => n[0]).filter((_, index) => index < 2).join("").toUpperCase();
}



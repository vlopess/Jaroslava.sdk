import type { ComponentDefinition } from "@jaroslava/types";

export const pageComponent: ComponentDefinition = {
  kind: "page",
  displayName: "Page",
  schema: {
    kind: "page",
    attributes: {
      title: { type: "string", required: true },
      layout: {
        type: "enum",
        enumValues: ["linkhub", "blog", "newsletter", "documentation", "portfolio", "docs"],
        required: false,
      },
      theme: { type: "enum", enumValues: ["light", "dark", "toggled"], required: false },
    },
  },
  render(node, renderedChildren, ctx) {
    const theme = (node.attrs.theme as string) ?? ctx.theme ?? "light";
    const title = (node.attrs.title as string) ?? "Untitled";
    const layout = String(node.attrs.layout ?? "default");
    const html = [
      "<!doctype html>",
      `<html lang="en" data-theme="${escapeAttr(theme)}">`,
      "<head>",
      '  <meta charset="utf-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
      `  <title>${escapeHtml(title)}</title>`,
      "</head>",
      `<style>${getPageStyle(layout)}</style>`,
      `<body class="jaro-page jaro-layout-${escapeAttr(String(node.attrs.layout ?? "default"))}">`,
      wrap(renderedChildren, layout),
      "</body>",
      "</html>",
    ].join("\n");
    return {
      html,
      css: [BASE_PAGE_CSS],
    };
  },
};


const DEFAULT_CSS = `
.jaro-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.jaro-layout-default {
  display: block;
}

.jaro-text {font-size: 0.8rem; color: var(--muted); margin-top: 0.2rem;}

.jaro-link {text-decoration: none;color: var(--jaro-fg);}
`;

const DOC_CSS = `
.jaro-docs {
  display: grid; 
  grid-template-columns: 110px 1fr; 
  gap: 1rem; 
  height: 100%;
}
.jaro-layout-doc {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem;
}

article {
  line-height: 1.8;
}

pre {
  overflow-x: auto;
}

code {
  font-family: monospace;
}

`;


const PORTFOLIO_CSS = `
.jaro-layout-portfolio {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.jaro-layout-portfolio .projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
`;

const BLOG_CSS = `
.jaro-layout-blog {
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem;
}

.jaro-layout-blog article {
  margin-bottom: 3rem;
}

.jaro-layout-blog h1,
.jaro-layout-blog h2 {
  margin-bottom: 1rem;
}

.jaro-layout-blog p {
  line-height: 1.8;
}

.jaro-post {
  border-bottom: 1px solid var(--muted);
}

`;

const LINKHUB_CSS = `
.jaro-layout-linkhub {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.jaro-container-linkhub {
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
}
`;


const PAGE_STYLES: Record<string, string> = {
  default: DEFAULT_CSS,
  linkhub: LINKHUB_CSS,
  blog: BLOG_CSS,
  portfolio: PORTFOLIO_CSS,
  doc: DOC_CSS,
};

function getPageStyle(style: string): string {
  const layout = PAGE_STYLES[style.toLowerCase()] ?? "";
  return `${DEFAULT_CSS}\n${layout}`;
}
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

function wrap(value: string, style: string) {
  if(style === 'doc') {return `<div class="jaro-docs">${wrapContentDoc(value)}</div>`;}
  if(style === 'linkhub') return `<div class="jaro-container-linkhub">${value}</div>`;
  return value;
}

function wrapContentDoc(html: string) {
    const marker = "</div>\n<section";
    const index = html.indexOf(marker);

    if (index === -1) return html;

    const sidebar = html.substring(0, index + 6); // inclui </div>
    const content = html.substring(index + 6);

    return `${sidebar}
    <div class="jaro-content">
    ${content}
    </div>`;
}

const BASE_PAGE_CSS = `
:root[data-theme="dark"] { --jaro-bg: #0F0F0D; --jaro-fg: #f4f4f5;  --line: #1E1C18; --muted: #666; --text: #F0EFEB; --jaro-code: #8BAD6B; --jaro-code-bg: #0C0C0B;}
:root[data-theme="light"] { --jaro-bg: #EBDFC7; --jaro-fg: #0b0b0d; --line: #EBEBDF; --muted: #0b0b0d; --text: #C47A45; --jaro-code: #8BAD6B; --jaro-code-bg: #EBEBDF;}
.jaro-page { --jaro: #C47A45; background: var(--jaro-bg, #fff); color: var(--jaro-fg, #0b0b0d); font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; margin: 0; }
.jaro-img {width: 100%;}
`;

import type { AnyNode, CallNode, InlineGroupNode, LinkNode, TextNode } from "@jaroslava/types";

export interface InlineParseDeps {
  generateId: () => string;
  version: string;
}

/**
 * Parses one inline content line into a sequence of AnyNode, handling:
 *   - `Label -> "url"`            => LinkNode
 *   - `img("link.com")`            => CallNode
 *   - `@("name")`                  => CallNode (callee "@")
 *   - `a + b + c`                  => InlineGroupNode of the parsed parts
 *   - plain prose                  => TextNode
 *
 * This is intentionally a small hand-rolled parser (not a full grammar)
 * since the inline syntax surface is narrow and explicit per the spec.
 */
export function parseInline(text: string, deps: InlineParseDeps): AnyNode {
  const parts = splitOnPlus(text);
  if (parts.length === 1) {
    return parseInlineAtom(parts[0]!, deps);
  }
  const items = parts.map((p) => parseInlineAtom(p, deps));
  const group: InlineGroupNode = {
    id: deps.generateId(),
    type: "InlineGroup",
    version: deps.version,
    items,
  };
  return group;
}

function splitOnPlus(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"' && text[i - 1] !== "\\") inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "+" && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts.filter((p) => p.length > 0);
}

const CALL_RE = /^([A-Za-z_@][A-Za-z0-9_]*)\(([^)]*)\)$/;
const ARROW_RE = /^(.*?)->\s*"([^"]*)"\s*$/;

function parseInlineAtom(atom: string, deps: InlineParseDeps): AnyNode {
  const arrowMatch = atom.match(ARROW_RE);
  if (arrowMatch) {
    const [, labelRaw, href] = arrowMatch;
    const label = labelRaw?.trim();
    const link: LinkNode = {
      id: deps.generateId(),
      type: "Link",
      version: deps.version,
      label: label ? label : undefined,
      href: href ?? "",
      internal: (href ?? "").startsWith("id:"),
    };
    return link;
  }

  const callMatch = atom.match(CALL_RE);
  if (callMatch) {
    const [, callee, argsRaw] = callMatch;
    const call: CallNode = {
      id: deps.generateId(),
      type: "Call",
      version: deps.version,
      callee: callee ?? "",
      args: parseArgs(argsRaw ?? ""),
    };
    return call;
  }

  const text: TextNode = {
    id: deps.generateId(),
    type: "Text",
    version: deps.version,
    value: atom,
  };
  return text;
}

function parseArgs(raw: string): (string | number | boolean | null)[] {
  if (raw.trim().length === 0) return [];
  // Args are comma-separated string/number/bool literals; quotes are
  // respected so commas inside a quoted string don't split incorrectly.
  const args: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = "";
  for (const ch of raw) {
    if (ch === '"') inQuotes = !inQuotes;
    if (!inQuotes && ch === ",") {
      args.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  args.push(current.trim());
  return args.map(coerceLiteral);
}

function coerceLiteral(value: string): string | number | boolean | null {
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  const num = Number(value);
  if (!Number.isNaN(num) && value !== "") return num;
  return value;
}

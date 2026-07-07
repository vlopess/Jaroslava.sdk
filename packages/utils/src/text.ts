/** Counts leading whitespace width, treating a tab as `tabWidth` spaces. */
export function indentWidth(line: string, tabWidth = 2): number {
  let width = 0;
  for (const ch of line) {
    if (ch === " ") width += 1;
    else if (ch === "\t") width += tabWidth;
    else break;
  }
  return width;
}

export function stripIndent(line: string): string {
  return line.replace(/^[ \t]+/, "");
}

export function isBlank(line: string): boolean {
  return line.trim().length === 0;
}

/** Splits "key: value" style lines. Returns undefined if no top-level colon. */
export function splitKeyValue(line: string): { key: string; value: string } | undefined {
  const idx = findTopLevelColon(line);
  if (idx === -1) return undefined;
  const key = line.slice(0, idx).trim();
  if(key.charAt(0).toUpperCase() === key.charAt(0)) return undefined;
  return {
    key: key,
    value: line.slice(idx + 1).trim(),
  };
}

/** Finds the first colon not inside quotes or parens, e.g. to correctly
 *  split `cover: img("a:b.jpg")` -> key "cover", value `img("a:b.jpg")`. */
function findTopLevelColon(line: string): number {
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i - 1] !== "\\") inQuotes = !inQuotes;
    if (inQuotes) continue;
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === ":" && depth === 0) return i;
  }
  return -1;
}

export function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

export function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

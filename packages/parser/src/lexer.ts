import { indentWidth, isBlank } from "@jaroslava/utils";

/**
 * A single logical line from the source, with its raw text, computed
 * indent depth (in "units", not raw spaces/tabs — see `computeDepths`),
 * and 1-based line number for diagnostics.
 */
export interface RawLine {
  lineNumber: number;
  raw: string;
  /** Leading-whitespace-stripped content. */
  content: string;
  indentWidthSpaces: number;
  /** Resolved indent depth (0 = top-level), filled in by `computeDepths`. */
  depth: number;
}

/**
 * First pass: split into lines, drop pure-blank lines (but remember them
 * isn't needed structurally — blank lines only matter as separators
 * between top-level @page blocks, which the parser detects via depth-0
 * @page markers, not via blank-line counting), and compute raw indent
 * width for each remaining line.
 */
export function tokenizeLines(source: string): RawLine[] {
  const physicalLines = source.split(/\r\n|\r|\n/);
  const lines: RawLine[] = [];
  physicalLines.forEach((raw, idx) => {
    if (isBlank(raw)) return;
    lines.push({
      lineNumber: idx + 1,
      raw,
      content: raw.replace(/^[ \t]+/, ""),
      indentWidthSpaces: indentWidth(raw),
      depth: 0, // resolved in computeDepths
    });
  });
  return computeDepths(lines);
}

/**
 * Converts raw indent widths (which may mix tab widths or inconsistent
 * spacing) into a stable 0-based depth sequence, the way Python's
 * tokenizer derives INDENT/DEDENT levels: each *distinct* width
 * encountered while descending becomes the next depth level.
 */
function computeDepths(lines: RawLine[]): RawLine[] {
  const stack: number[] = [0];
  for (const line of lines) {
    const width = line.indentWidthSpaces;
    while (stack.length > 1 && width < (stack[stack.length - 1] as number)) {
      stack.pop();
    }
    if (width > (stack[stack.length - 1] as number)) {
      stack.push(width);
    }
    line.depth = stack.length - 1;
  }
  return lines;
}

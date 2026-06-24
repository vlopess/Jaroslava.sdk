import type { AnyNode } from "@jaroslava/types";
import { quote } from "@jaroslava/utils";

/** Renders a single inline atom (Text/Link/Call) back to its source form. */
export function serializeInlineAtom(node: AnyNode): string {
  switch (node.type) {
    case "Text":
      return node.value;
    case "Link": {
      const href = quote(node.href);
      return node.label ? `${node.label} -> ${href}` : `-> ${href}`;
    }
    case "Call": {
      const args = node.args
        .map((a) => (typeof a === "string" ? quote(a) : JSON.stringify(a)))
        .join(", ");
      return `${node.callee}(${args})`;
    }
    case "InlineGroup":
      return node.items.map(serializeInlineAtom).join(" + ");
    case "CodeBlock":
      return node.code;
    default:
      return "";
  }
}

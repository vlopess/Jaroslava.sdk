import type {
  AttributeSchema,
  ComponentNode,
  ComponentSchema,
  Diagnostic,
  JaroAttributeValue,
} from "@jaroslava/types";

/**
 * Validates a single ComponentNode's attrs/children against its declared
 * ComponentSchema. This function has zero knowledge of *which* component
 * kind it's validating — it only reads the schema object handed to it by
 * the plugin that owns that kind.
 */
export function validateAgainstSchema(
  node: ComponentNode,
  schema: ComponentSchema,
  path: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const [attrName, attrSchema] of Object.entries(schema.attributes ?? {})) {
    const value = node.attrs[attrName];
    const present = value !== undefined && value !== null;

    if (attrSchema.required && !present) {
      diagnostics.push({
        severity: "error",
        code: "missing-required-attribute",
        message: `Component "@${node.kind}" is missing required attribute "${attrName}".`,
        path,
        span: node.span,
      });
      continue;
    }
    if (present) {
      const typeDiag = checkAttributeType(node, attrName, value, attrSchema, path);
      if (typeDiag) diagnostics.push(typeDiag);
    }
  }

  if (schema.allowedChildren) {
    for (const child of node.children) {
      if (!schema.allowedChildren.includes(child.type)) {
        diagnostics.push({
          severity: "warning",
          code: "unexpected-child-type",
          message: `Component "@${node.kind}" does not normally allow a child of type "${child.type}".`,
          path,
          span: child.span,
        });
      }
    }
  }

  if (schema.allowedChildKinds) {
    for (const child of node.children) {
      if (child.type === "Component" && !schema.allowedChildKinds.includes(child.kind)) {
        diagnostics.push({
          severity: "warning",
          code: "unexpected-child-kind",
          message: `Component "@${node.kind}" does not normally allow a child component "@${child.kind}".`,
          path,
          span: child.span,
        });
      }
    }
  }

  return diagnostics;
}

function checkAttributeType(
  node: ComponentNode,
  attrName: string,
  value: JaroAttributeValue,
  schema: AttributeSchema,
  path: string,
): Diagnostic | undefined {
  const fail = (expected: string): Diagnostic => ({
    severity: "error",
    code: "invalid-attribute-type",
    message: `Attribute "${attrName}" on "@${node.kind}" should be ${expected}, got ${JSON.stringify(value)}.`,
    path,
    span: node.span,
  });

  switch (schema.type) {
    case "string":
      return typeof value === "string" ? undefined : fail("a string");
    case "number":
      return typeof value === "number" ? undefined : fail("a number");
    case "boolean":
      return typeof value === "boolean" ? undefined : fail("a boolean");
    case "array":
      return Array.isArray(value) ? undefined : fail("an array");
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value)
        ? undefined
        : fail("an object");
    case "enum":
      return typeof value === "string" && schema.enumValues?.includes(value)
        ? undefined
        : fail(`one of [${(schema.enumValues ?? []).join(", ")}]`);
    default:
      return undefined;
  }
}

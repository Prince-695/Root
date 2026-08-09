import type { ModuleGraph } from "../engine/module-graph.js";
import type { Operation, ZodField } from "../engine/operations.js";

export type RecipeId = "schema" | "validate" | "resource" | "auth";

export type RecipeContext = {
  graph: ModuleGraph;
  /** PascalCase or kebab resource name, e.g. "posts" */
  resourceName?: string;
  fields?: ZodField[];
  mountPath?: string;
};

export type Recipe = {
  id: RecipeId;
  description: string;
  /** Other recipe ids that must be planned first when missing from the graph. */
  registryDependencies: RecipeId[];
  plan: (ctx: RecipeContext) => Operation[];
};

export function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

export function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function schemaExportName(resourceName: string): string {
  return `${toCamelCase(resourceName)}Schema`;
}

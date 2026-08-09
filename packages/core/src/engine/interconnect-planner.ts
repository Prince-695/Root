import { type RecipeContext, type RecipeId, getRecipe } from "../registry/index.js";
import type { ModuleGraph } from "./module-graph.js";
import { hasAuth, hasModule } from "./module-graph.js";
import type { Operation } from "./operations.js";

export type PlanRequest = {
  recipeId: RecipeId;
  graph: ModuleGraph;
  resourceName?: string;
  fields?: RecipeContext["fields"];
  mountPath?: string;
  /** When true, include runCommand ops from recipes (default false). */
  allowRunCommand?: boolean;
};

/**
 * Resolve registryDependencies depth-first, then the target recipe.
 * Skips deps already satisfied by the module graph / probes.
 */
export function planInterconnect(request: PlanRequest): Operation[] {
  const visited = new Set<RecipeId>();
  const ops: Operation[] = [];

  function isSatisfied(id: RecipeId): boolean {
    const { graph } = request;
    switch (id) {
      case "schema":
        return graph.probe.hasSchemaFile;
      case "validate":
        return graph.probe.hasValidateMiddleware || hasModule(graph, "validate");
      case "auth":
        return hasAuth(graph);
      case "resource":
        return Boolean(request.resourceName && hasModule(graph, request.resourceName));
      default:
        return false;
    }
  }

  // Idempotent no-op when the requested recipe is already present.
  if (isSatisfied(request.recipeId)) {
    return [];
  }

  function walk(id: RecipeId): void {
    if (visited.has(id)) {
      return;
    }
    visited.add(id);

    const recipe = getRecipe(id);
    for (const dep of recipe.registryDependencies) {
      if (!isSatisfied(dep)) {
        walk(dep);
      }
    }

    if (isSatisfied(id) && id !== request.recipeId) {
      return;
    }

    const ctx: RecipeContext = { graph: request.graph };
    if (request.resourceName !== undefined) {
      ctx.resourceName = request.resourceName;
    }
    if (request.fields !== undefined) {
      ctx.fields = request.fields;
    }
    if (request.mountPath !== undefined) {
      ctx.mountPath = request.mountPath;
    }
    const planned = recipe.plan(ctx);

    for (const op of planned) {
      if (op.type === "runCommand" && !request.allowRunCommand) {
        continue;
      }
      ops.push(op);
    }
  }

  walk(request.recipeId);
  return ops;
}

/** Snapshot helper for determinism tests. */
export function planSnapshot(request: PlanRequest): string {
  return JSON.stringify(planInterconnect(request), null, 2);
}

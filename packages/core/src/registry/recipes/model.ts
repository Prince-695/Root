import type { Operation } from "../../engine/operations.js";
import { defaultResourceZodFields, resolveResourceNames } from "../codegen/resource-files.js";
import type { Recipe } from "../types.js";

/** Atomic model: Zod schema + ORM artifact + manifest (no HTTP wiring). */
export const modelRecipe: Recipe = {
  id: "model",
  description: "Data model in Schema Registry and ORM",
  registryDependencies: ["schema"],
  plan(ctx) {
    const resourceName = ctx.resourceName;
    if (!resourceName) {
      throw new Error("model recipe requires resourceName");
    }

    const names = resolveResourceNames(resourceName);
    if (ctx.graph.config.modules[names.slug]) {
      return [];
    }

    const fields = ctx.fields ?? defaultResourceZodFields();
    const addedAt = ctx.addedAt ?? "1970-01-01T00:00:00.000Z";
    const ops: Operation[] = [
      {
        type: "updateSchema",
        kind: "resource",
        resourceName: names.slug,
        fields,
      },
    ];

    const orm = ctx.graph.config.orm;
    if (orm === "prisma") {
      ops.push({
        type: "updateOrm",
        kind: "prisma-model",
        resourceName: names.slug,
        fields,
      });
      ops.push({
        type: "runCommand",
        command: "pnpm",
        args: ["exec", "prisma", "generate"],
      });
    } else if (orm === "drizzle") {
      ops.push({
        type: "updateOrm",
        kind: "drizzle-table",
        resourceName: names.slug,
        fields,
      });
    } else if (orm === "mongoose") {
      ops.push({
        type: "updateOrm",
        kind: "mongoose-model",
        resourceName: names.slug,
        fields,
      });
    }

    ops.push({
      type: "updateManifest",
      moduleName: names.slug,
      entry: { type: "model", addedAt },
    });

    return ops;
  },
};

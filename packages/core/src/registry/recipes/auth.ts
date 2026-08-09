import type { Operation } from "../../engine/operations.js";
import type { Recipe } from "../types.js";

/** JWT auth stub — middleware + auth schemas (Phase 6 will deepen this). */
export const authRecipe: Recipe = {
  id: "auth",
  description: "JWT auth middleware and Zod auth schemas",
  registryDependencies: ["schema", "validate"],
  plan(ctx) {
    if (ctx.graph.config.modules.auth || ctx.graph.probe.hasAuthMiddleware) {
      return [];
    }

    const mwDir = ctx.graph.config.aliases.middleware;
    const ops: Operation[] = [
      {
        type: "updateSchema",
        kind: "auth",
      },
      {
        type: "createFile",
        path: `${mwDir}/auth.ts`,
        content: `import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
`,
      },
      {
        type: "ensureDependency",
        name: "jsonwebtoken",
        version: "^9.0.2",
      },
      {
        type: "updateManifest",
        moduleName: "auth",
        entry: {
          type: "auth",
          addedAt: "1970-01-01T00:00:00.000Z",
        },
      },
    ];

    return ops;
  },
};

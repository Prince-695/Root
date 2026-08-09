import type { Recipe } from "../types.js";

/** Middleware stub for request validation. */
export const validateRecipe: Recipe = {
  id: "validate",
  description: "Zod validate middleware",
  registryDependencies: ["schema"],
  plan(ctx) {
    if (ctx.graph.probe.hasValidateMiddleware) {
      return [];
    }

    const mwDir = ctx.graph.config.aliases.middleware;
    return [
      {
        type: "createFile",
        path: `${mwDir}/validate.ts`,
        content: `import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    req.body = parsed.data;
    next();
  };
}
`,
      },
      {
        type: "updateManifest",
        moduleName: "validate",
        entry: {
          type: "middleware",
          addedAt: "1970-01-01T00:00:00.000Z",
        },
      },
    ];
  },
};

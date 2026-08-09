import type { Operation } from "../../engine/operations.js";
import { buildAuthFiles } from "../codegen/auth-files.js";
import type { Recipe } from "../types.js";

const USER_FIELDS = [
  { name: "email", zodType: "z.string().email()" },
  { name: "passwordHash", zodType: "z.string().min(1)" },
];

/** Full JWT auth module: schemas, middleware, MVC files, User model, env/readme. */
export const authRecipe: Recipe = {
  id: "auth",
  description: "JWT auth with signup/signin/signout and authenticate middleware",
  registryDependencies: ["schema", "validate"],
  plan(ctx) {
    // Only the manifest entry marks auth as installed (config.auth=jwt alone is not enough).
    if (ctx.graph.config.modules.auth) {
      return [];
    }

    const files = buildAuthFiles(ctx.graph.config);
    const serverRel = ctx.graph.config.aliases.server;
    const anchor = ctx.graph.config.inject.routesAnchor;
    const mountLine = `app.use("/auth", authRouter);`;
    const addedAt = ctx.addedAt ?? "1970-01-01T00:00:00.000Z";
    const orm = ctx.graph.config.orm;

    const ops: Operation[] = [
      { type: "updateSchema", kind: "auth" },
      {
        type: "createFile",
        path: files.typesPath,
        content: files.typesContent,
      },
      {
        type: "createFile",
        path: files.middlewarePath,
        content: files.middlewareContent,
      },
      {
        type: "createFile",
        path: files.servicePath,
        content: files.serviceContent,
      },
      {
        type: "createFile",
        path: files.controllerPath,
        content: files.controllerContent,
      },
      {
        type: "createFile",
        path: files.routePath,
        content: files.routeContent,
      },
      {
        type: "patchFile",
        path: serverRel,
        kind: "ast-import",
        source: "./routes/auth.routes.js",
        specifiers: ["authRouter"],
      },
      {
        type: "patchFile",
        path: serverRel,
        kind: "anchor",
        anchor,
        insertion: `  ${mountLine}`,
        skipIfContains: mountLine,
      },
      {
        type: "ensureText",
        path: ".env.example",
        skipIfContains: "ACCESS_TOKEN_SECRET",
        transform: "access-token-env",
      },
      {
        type: "ensureText",
        path: "src/config/env.ts",
        skipIfContains: "ACCESS_TOKEN_SECRET",
        transform: "access-token-env-ts",
      },
      {
        type: "ensureText",
        path: "README.md",
        skipIfContains: "## Authentication",
        transform: "auth-readme",
      },
      {
        type: "ensureDependency",
        name: "jsonwebtoken",
        version: "^9.0.2",
      },
      {
        type: "ensureDependency",
        name: "bcryptjs",
        version: "^2.4.3",
      },
      {
        type: "ensureDependency",
        name: "@types/jsonwebtoken",
        version: "^9.0.9",
        dev: true,
      },
      {
        type: "ensureDependency",
        name: "@types/bcryptjs",
        version: "^2.4.6",
        dev: true,
      },
    ];

    if (orm === "prisma") {
      ops.push({
        type: "updateOrm",
        kind: "prisma-model",
        resourceName: "user",
        fields: USER_FIELDS,
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
        resourceName: "user",
        fields: USER_FIELDS,
      });
    } else if (orm === "mongoose") {
      ops.push({
        type: "updateOrm",
        kind: "mongoose-model",
        resourceName: "user",
        fields: USER_FIELDS,
      });
    }

    ops.push({
      type: "updateManifest",
      moduleName: "auth",
      entry: {
        type: "auth",
        addedAt,
      },
    });

    return ops;
  },
};

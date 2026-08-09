import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AddAuthError, addAuth } from "../src/add/auth.js";
import { addRoute } from "../src/add/route.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

describe("add auth (Phase 6)", () => {
  it("installs auth routes, middleware, schemas, env, and README", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-auth-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("auth-api", { docker: false, database: "none", orm: "none" }),
    });

    const result = await addAuth({
      projectRoot: dir,
      skipGenerate: true,
      runCommand: async () => {},
      addedAt: "2026-08-09T00:00:00.000Z",
    });

    expect(result.ops.length).toBeGreaterThan(5);
    await access(path.join(dir, "src/middleware/auth.ts"));
    await access(path.join(dir, "src/routes/auth.routes.ts"));
    await access(path.join(dir, "src/services/auth.service.ts"));
    await access(path.join(dir, "src/types/express.d.ts"));

    const middleware = await readFile(path.join(dir, "src/middleware/auth.ts"), "utf8");
    expect(middleware).toContain("export function authenticate");
    expect(middleware).not.toMatch(/sk_live|super-secret-production/);

    const schema = await readFile(path.join(dir, "src/schema.ts"), "utf8");
    expect(schema.indexOf("signUpSchema")).toBeLessThan(schema.indexOf("// ─── Resource"));
    expect(schema).toContain("export { signUpSchema, signInSchema }");

    const server = await readFile(path.join(dir, "src/server.ts"), "utf8");
    expect(server).toContain('app.use("/auth", authRouter)');

    const envExample = await readFile(path.join(dir, ".env.example"), "utf8");
    expect(envExample).toContain("ACCESS_TOKEN_SECRET");

    const envTs = await readFile(path.join(dir, "src/config/env.ts"), "utf8");
    expect(envTs).toContain("ACCESS_TOKEN_SECRET");

    const readme = await readFile(path.join(dir, "README.md"), "utf8");
    expect(readme).toContain("## Authentication");

    const root = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
      auth: string;
      modules: Record<string, unknown>;
    };
    expect(root.auth).toBe("jwt");
    expect(root.modules.auth).toBeTruthy();
  });

  it("makes subsequent add route auth-aware (authenticate on POST)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-auth-route-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("auth-route", { docker: false, database: "none", orm: "none" }),
    });
    await addAuth({ projectRoot: dir, skipGenerate: true, runCommand: async () => {} });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });

    const route = await readFile(path.join(dir, "src/routes/post.routes.ts"), "utf8");
    expect(route).toContain("authenticate");
    expect(route).toMatch(/\.post\(\s*"\/"\s*,\s*authenticate/);

    const controller = await readFile(path.join(dir, "src/controllers/post.controller.ts"), "utf8");
    expect(controller).toContain("authenticatedUser");
    expect(controller).toContain("_ignoredAuthorId");

    const schema = await readFile(path.join(dir, "src/schema.ts"), "utf8");
    expect(schema).toContain("postSchema");
    expect(schema).not.toMatch(/postSchema[\s\S]*authorId/);
  });

  it("retrofits existing resources when auth is added after route (order B)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-auth-orderb-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("order-b", { docker: false, database: "none", orm: "none" }),
    });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });

    const before = await readFile(path.join(dir, "src/routes/post.routes.ts"), "utf8");
    expect(before).not.toContain("authenticate");

    const result = await addAuth({
      projectRoot: dir,
      skipGenerate: true,
      runCommand: async () => {},
    });
    expect(result.warnings.some((w) => /retrofit/i.test(w))).toBe(true);

    const after = await readFile(path.join(dir, "src/routes/post.routes.ts"), "utf8");
    expect(after).toContain("authenticate");
    const controller = await readFile(path.join(dir, "src/controllers/post.controller.ts"), "utf8");
    expect(controller).toContain("authenticatedUser");
  });

  it("refuses duplicate auth", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-auth-dup-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("dup-auth", { docker: false, database: "none", orm: "none" }),
    });
    await addAuth({ projectRoot: dir, skipGenerate: true, runCommand: async () => {} });
    await expect(
      addAuth({ projectRoot: dir, skipGenerate: true, runCommand: async () => {} }),
    ).rejects.toBeInstanceOf(AddAuthError);
  });
});

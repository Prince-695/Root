import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRootJsonFixture, writeRootJson } from "../src/config/root-json.js";
import { planInterconnect } from "../src/engine/interconnect-planner.js";
import { loadModuleGraph } from "../src/engine/module-graph.js";
import type { Operation } from "../src/engine/operations.js";
import { Transaction, applyOperations } from "../src/engine/transaction.js";
import { SCHEMA_FIXTURE, SERVER_FIXTURE } from "./fixtures/server-fixture.js";

async function projectFixture(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "root-tx-"));
  await writeRootJson(dir, createRootJsonFixture());
  await mkdir(path.join(dir, "src", "routes"), { recursive: true });
  await mkdir(path.join(dir, "src", "middleware"), { recursive: true });
  await writeFile(path.join(dir, "src", "server.ts"), SERVER_FIXTURE, "utf8");
  await writeFile(path.join(dir, "src", "schema.ts"), SCHEMA_FIXTURE, "utf8");
  await writeFile(
    path.join(dir, "package.json"),
    `${JSON.stringify({ name: "fixture", dependencies: { zod: "^3.24.2" } }, null, 2)}\n`,
    "utf8",
  );
  return dir;
}

describe("Transaction", () => {
  it("rolls back to byte-identical state when op N fails", async () => {
    const dir = await projectFixture();
    const beforeServer = await readFile(path.join(dir, "src", "server.ts"), "utf8");
    const beforeSchema = await readFile(path.join(dir, "src", "schema.ts"), "utf8");
    const beforeRoot = await readFile(path.join(dir, "root.json"), "utf8");
    const beforePkg = await readFile(path.join(dir, "package.json"), "utf8");

    const graph = await loadModuleGraph(dir);
    const ops = planInterconnect({
      recipeId: "resource",
      graph,
      resourceName: "posts",
      fields: [{ name: "title", zodType: "z.string()" }],
    });

    const tx = new Transaction({ projectRoot: dir, failAtIndex: 2 });
    await expect(tx.apply(ops)).rejects.toThrow(/Injected failure/);

    expect(await readFile(path.join(dir, "src", "server.ts"), "utf8")).toBe(beforeServer);
    expect(await readFile(path.join(dir, "src", "schema.ts"), "utf8")).toBe(beforeSchema);
    expect(await readFile(path.join(dir, "root.json"), "utf8")).toBe(beforeRoot);
    expect(await readFile(path.join(dir, "package.json"), "utf8")).toBe(beforePkg);
  });

  it("applies resource plan: import + mount + schema", async () => {
    const dir = await projectFixture();
    await writeFile(
      path.join(dir, "src", "middleware", "validate.ts"),
      "export function validate() {}",
      "utf8",
    );
    const graph = await loadModuleGraph(dir);
    const ops = planInterconnect({
      recipeId: "resource",
      graph,
      resourceName: "posts",
      fields: [{ name: "title", zodType: "z.string()" }],
    });

    await applyOperations(dir, ops);

    const server = await readFile(path.join(dir, "src", "server.ts"), "utf8");
    expect(server).toContain('import { postsRouter } from "./routes/posts.routes.js"');
    expect(server).toContain('app.use("/api/posts", postsRouter)');

    const schema = await readFile(path.join(dir, "src", "schema.ts"), "utf8");
    expect(schema).toContain("postsSchema");
    expect(schema).toContain("export { postsSchema }");

    const root = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
      modules: Record<string, unknown>;
    };
    expect(root.modules.posts).toBeTruthy();
  });

  it("rejects syntax-breaking patch before commit", async () => {
    const dir = await projectFixture();
    const before = await readFile(path.join(dir, "src", "server.ts"), "utf8");
    const ops: Operation[] = [
      {
        type: "patchFile",
        path: "src/server.ts",
        kind: "anchor",
        anchor: "[ROOT-INJECT:ROUTES]",
        insertion: "  const broken = {",
      },
    ];
    await expect(applyOperations(dir, ops)).rejects.toThrow();
    expect(await readFile(path.join(dir, "src", "server.ts"), "utf8")).toBe(before);
  });
});

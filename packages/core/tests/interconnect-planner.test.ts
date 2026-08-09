import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRootJsonFixture, writeRootJson } from "../src/config/root-json.js";
import { planInterconnect, planSnapshot } from "../src/engine/interconnect-planner.js";
import { loadModuleGraph } from "../src/engine/module-graph.js";
import { SCHEMA_FIXTURE, SERVER_FIXTURE } from "./fixtures/server-fixture.js";

async function fixtureProject(opts: {
  withSchema?: boolean;
  withValidate?: boolean;
  modules?: Record<string, { type: "resource" | "middleware" | "auth"; addedAt: string }>;
}): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "root-plan-"));
  await writeRootJson(
    dir,
    createRootJsonFixture({
      modules: opts.modules ?? {},
    }),
  );
  await mkdir(path.join(dir, "src", "routes"), { recursive: true });
  await mkdir(path.join(dir, "src", "middleware"), { recursive: true });
  await writeFile(path.join(dir, "src", "server.ts"), SERVER_FIXTURE, "utf8");
  if (opts.withSchema !== false) {
    await writeFile(path.join(dir, "src", "schema.ts"), SCHEMA_FIXTURE, "utf8");
  }
  if (opts.withValidate) {
    await writeFile(path.join(dir, "src", "middleware", "validate.ts"), "export {}", "utf8");
  }
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "fixture", dependencies: {} }, null, 2),
    "utf8",
  );
  return dir;
}

describe("InterconnectPlanner", () => {
  it("orders schema → validate → resource deps deterministically", async () => {
    const dir = await fixtureProject({ withSchema: false, withValidate: false });
    const graph = await loadModuleGraph(dir);
    const ops = planInterconnect({
      recipeId: "resource",
      graph,
      resourceName: "posts",
      fields: [{ name: "title", zodType: "z.string()" }],
    });

    const types = ops.map((op) => op.type);
    expect(types[0]).toBe("createFile"); // schema
    expect(ops.some((op) => op.type === "createFile" && op.path.includes("validate"))).toBe(true);
    expect(ops.some((op) => op.type === "updateSchema" && op.kind === "resource")).toBe(true);

    const snapA = planSnapshot({
      recipeId: "resource",
      graph,
      resourceName: "posts",
      fields: [{ name: "title", zodType: "z.string()" }],
    });
    const snapB = planSnapshot({
      recipeId: "resource",
      graph,
      resourceName: "posts",
      fields: [{ name: "title", zodType: "z.string()" }],
    });
    expect(snapA).toBe(snapB);
    expect(snapA).toMatchSnapshot();
  });

  it("skips satisfied validate dependency", async () => {
    const dir = await fixtureProject({ withValidate: true });
    const graph = await loadModuleGraph(dir);
    const ops = planInterconnect({
      recipeId: "resource",
      graph,
      resourceName: "posts",
    });
    expect(ops.some((op) => op.type === "createFile" && op.path.includes("validate"))).toBe(false);
  });

  it("plans auth after schema deps", async () => {
    const dir = await fixtureProject({});
    const graph = await loadModuleGraph(dir);
    const ops = planInterconnect({ recipeId: "auth", graph });
    expect(ops.find((op) => op.type === "updateSchema")).toMatchObject({ kind: "auth" });
    expect(ops.some((op) => op.type === "createFile" && op.path.endsWith("auth.ts"))).toBe(true);
  });
});

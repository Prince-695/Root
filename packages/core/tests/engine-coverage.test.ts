import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  RootJsonValidationError,
  createRootJsonFixture,
  writeRootJson,
} from "../src/config/root-json.js";
import { isRootJsonValidationError, readRootJsonRaw } from "../src/engine/detector.js";
import { planInterconnect } from "../src/engine/interconnect-planner.js";
import { loadModuleGraph } from "../src/engine/module-graph.js";
import { type Operation, stableStringifyOperations } from "../src/engine/operations.js";
import { Transaction, applyOperations } from "../src/engine/transaction.js";
import {
  defaultResourceFields,
  ensureBanners,
  loadSchemaRegistry,
  saveSchemaRegistry,
} from "../src/mutators/schema-registry.js";
import { getRecipe, listRecipeIds } from "../src/registry/index.js";
import { SCHEMA_FIXTURE, SERVER_FIXTURE } from "./fixtures/server-fixture.js";

describe("engine coverage helpers", () => {
  it("stringifies operations stably", () => {
    const ops: Operation[] = [
      { type: "runCommand", command: "echo", args: ["hi"] },
      { type: "ensureDependency", name: "zod", version: "^3.24.2", dev: true },
    ];
    expect(stableStringifyOperations(ops)).toContain("runCommand");
  });

  it("covers detector raw read + validation type guard", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "root-det-"));
    expect(await readRootJsonRaw(dir)).toBeNull();
    await writeFile(path.join(dir, "root.json"), "{}\n", "utf8");
    expect(await readRootJsonRaw(dir)).toContain("{");
    expect(isRootJsonValidationError(new RootJsonValidationError("x", []))).toBe(true);
    expect(isRootJsonValidationError(new Error("nope"))).toBe(false);
  });

  it("covers dryRun, runCommand, ensureDependency skip, and committed rollback no-op", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "root-cov-"));
    await writeRootJson(dir, createRootJsonFixture());
    await mkdir(path.join(dir, "src"), { recursive: true });
    await writeFile(path.join(dir, "src", "server.ts"), SERVER_FIXTURE, "utf8");
    await writeFile(path.join(dir, "src", "schema.ts"), SCHEMA_FIXTURE, "utf8");
    await writeFile(
      path.join(dir, "package.json"),
      `${JSON.stringify({ name: "x", dependencies: { zod: "^3.24.2" }, devDependencies: {} }, null, 2)}\n`,
      "utf8",
    );

    const ran: string[] = [];
    await applyOperations(
      dir,
      [
        { type: "ensureDependency", name: "zod", version: "^3.24.2" },
        { type: "ensureDependency", name: "vitest", version: "^3.0.0", dev: true },
        { type: "runCommand", command: "echo", args: ["ok"] },
        {
          type: "createFile",
          path: "src/note.ts",
          content: "export const note = 1;\n",
        },
      ],
      {
        dryRun: true,
        runCommand: async (command, args) => {
          ran.push([command, ...args].join(" "));
        },
      },
    );
    expect(ran).toEqual([]);
    await expect(readFile(path.join(dir, "src", "note.ts"), "utf8")).rejects.toThrow();

    const tx = new Transaction({
      projectRoot: dir,
      runCommand: async (command, args) => {
        ran.push([command, ...args].join(" "));
      },
    });
    await tx.apply([
      { type: "runCommand", command: "echo", args: ["live"] },
      { type: "ensureDependency", name: "zod", version: "^3.24.2" },
      { type: "ensureDependency", name: "cors", version: "^2.8.5" },
    ]);
    expect(ran).toContain("echo live");
    await tx.rollback();
    const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies.cors).toBe("^2.8.5");
  });

  it("wraps non-Error failures and skips runCommand when disallowed in planner", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "root-err-"));
    await writeRootJson(dir, createRootJsonFixture());
    await mkdir(path.join(dir, "src", "middleware"), { recursive: true });
    await writeFile(path.join(dir, "src", "schema.ts"), SCHEMA_FIXTURE, "utf8");
    await writeFile(path.join(dir, "src", "server.ts"), SERVER_FIXTURE, "utf8");
    await writeFile(
      path.join(dir, "package.json"),
      `${JSON.stringify({ name: "x", dependencies: {} }, null, 2)}\n`,
      "utf8",
    );

    const graph = await loadModuleGraph(dir);
    const ops = planInterconnect({
      recipeId: "auth",
      graph,
      allowRunCommand: false,
    });
    expect(ops.every((op) => op.type !== "runCommand")).toBe(true);

    const already = await loadModuleGraph(dir);
    already.config.modules.posts = {
      type: "resource",
      addedAt: "1970-01-01T00:00:00.000Z",
    };
    expect(
      planInterconnect({ recipeId: "resource", graph: already, resourceName: "posts" }),
    ).toEqual([]);

    expect(listRecipeIds()).toContain("resource");
    expect(getRecipe("schema").id).toBe("schema");
    expect(defaultResourceFields("posts")[0]?.name).toBe("id");

    expect(() => ensureBanners("no banners")).toThrow(/missing required banner/);

    const registry = await loadSchemaRegistry(dir, "src/schema.ts");
    registry.content = SCHEMA_FIXTURE;
    await saveSchemaRegistry(registry);

    const tx = new Transaction({
      projectRoot: dir,
      runCommand: async () => {
        throw "boom-string";
      },
    });
    await expect(tx.apply([{ type: "runCommand", command: "x", args: [] }])).rejects.toThrow(
      /boom-string/,
    );
  });
});

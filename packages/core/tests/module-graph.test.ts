import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRootJsonFixture, writeRootJson } from "../src/config/root-json.js";
import {
  hasAuth,
  hasModule,
  listModules,
  loadModuleGraph,
  resolveAliasPath,
} from "../src/engine/module-graph.js";

describe("ModuleGraph", () => {
  it("loads config and probes disk", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "root-graph-"));
    await writeRootJson(
      dir,
      createRootJsonFixture({
        auth: "jwt",
        modules: {
          posts: { type: "resource", addedAt: "1970-01-01T00:00:00.000Z" },
        },
      }),
    );
    await mkdir(path.join(dir, "src", "middleware"), { recursive: true });
    await writeFile(path.join(dir, "src", "schema.ts"), "export {}", "utf8");
    await writeFile(path.join(dir, "src", "server.ts"), "export {}", "utf8");
    await writeFile(path.join(dir, "src", "middleware", "auth.ts"), "export {}", "utf8");

    const graph = await loadModuleGraph(dir);
    expect(graph.probe.hasSchemaFile).toBe(true);
    expect(graph.probe.hasServerFile).toBe(true);
    expect(graph.probe.hasAuthMiddleware).toBe(true);
    expect(hasAuth(graph)).toBe(true);
    expect(hasModule(graph, "posts")).toBe(true);
    expect(listModules(graph)).toEqual(["posts"]);
    expect(resolveAliasPath(graph, "schema")).toBe(path.join(dir, "src", "schema.ts"));
  });
});

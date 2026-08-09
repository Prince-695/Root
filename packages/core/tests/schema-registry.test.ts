import { describe, expect, it } from "vitest";
import {
  appendResourceSchema,
  applySchemaUpdates,
  collectExportNames,
  defaultResourceFields,
  ensureBanners,
  loadSchemaRegistry,
  rewriteExports,
  saveSchemaRegistry,
  writeAuthSchemas,
} from "../src/mutators/schema-registry.js";
import { SCHEMA_FIXTURE } from "./fixtures/server-fixture.js";

describe("SchemaRegistry", () => {
  it("keeps auth before resources regardless of call order", () => {
    const postsFirst = appendResourceSchema(SCHEMA_FIXTURE, "posts", [
      { name: "title", zodType: "z.string()" },
    ]);
    const withAuth = writeAuthSchemas(postsFirst);
    const comments = appendResourceSchema(withAuth, "comments", [
      { name: "body", zodType: "z.string()" },
    ]);

    const authIdx = comments.indexOf("signUpSchema");
    const postsIdx = comments.indexOf("postsSchema");
    const commentsIdx = comments.indexOf("commentsSchema");
    const exportsIdx = comments.indexOf("// ─── Exports");

    expect(authIdx).toBeGreaterThan(-1);
    expect(postsIdx).toBeGreaterThan(authIdx);
    expect(commentsIdx).toBeGreaterThan(postsIdx);
    expect(exportsIdx).toBeGreaterThan(commentsIdx);

    const names = collectExportNames(comments);
    expect(names).toEqual(["signUpSchema", "signInSchema", "postsSchema", "commentsSchema"]);
    expect(rewriteExports(comments)).toContain(
      "export { signUpSchema, signInSchema, postsSchema, commentsSchema }",
    );
  });

  it("applySchemaUpdates normalizes mixed order", () => {
    const next = applySchemaUpdates(SCHEMA_FIXTURE, [
      {
        kind: "resource",
        resourceName: "posts",
        fields: [{ name: "title", zodType: "z.string()" }],
      },
      { kind: "auth" },
      {
        kind: "resource",
        resourceName: "tags",
        fields: [{ name: "name", zodType: "z.string()" }],
      },
    ]);

    expect(next.indexOf("signUpSchema")).toBeLessThan(next.indexOf("postsSchema"));
    expect(next.indexOf("postsSchema")).toBeLessThan(next.indexOf("tagsSchema"));
    expect(collectExportNames(next)).toEqual([
      "signUpSchema",
      "signInSchema",
      "postsSchema",
      "tagsSchema",
    ]);
  });

  it("is idempotent for auth and resource appends", () => {
    const once = writeAuthSchemas(SCHEMA_FIXTURE);
    const twice = writeAuthSchemas(once);
    expect(twice).toBe(once);

    const withPosts = appendResourceSchema(once, "posts", [
      { name: "title", zodType: "z.string()" },
    ]);
    const again = appendResourceSchema(withPosts, "posts", [
      { name: "title", zodType: "z.string()" },
    ]);
    expect(again.match(/postsSchema/g)?.length).toBe(withPosts.match(/postsSchema/g)?.length);
  });

  it("throws when banners are missing and loads/saves from disk", async () => {
    const { mkdtemp, writeFile } = await import("node:fs/promises");
    const os = await import("node:os");
    const path = await import("node:path");
    const dir = await mkdtemp(path.join(os.tmpdir(), "root-schema-"));
    await writeFile(path.join(dir, "schema.ts"), SCHEMA_FIXTURE, "utf8");
    const registry = await loadSchemaRegistry(dir, "schema.ts");
    expect(ensureBanners(registry.content)).toContain("Auth Schemas");
    registry.content = writeAuthSchemas(registry.content);
    await saveSchemaRegistry(registry);
    expect(defaultResourceFields("user").some((f) => f.name === "email")).toBe(true);
    expect(() => ensureBanners("export {}")).toThrow(/missing required banner/);
  });

  it("microbench: 100 schema appends stay under budget", () => {
    let content = SCHEMA_FIXTURE;
    const start = performance.now();
    for (let i = 0; i < 100; i += 1) {
      content = appendResourceSchema(content, `item${i}`, [
        { name: "title", zodType: "z.string()" },
      ]);
    }
    const elapsedMs = performance.now() - start;
    expect(collectExportNames(content)).toHaveLength(100);
    // Baseline: local runs typically < 50ms; allow generous CI budget.
    expect(elapsedMs).toBeLessThan(2000);
  });
});

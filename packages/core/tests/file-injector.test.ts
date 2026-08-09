import { describe, expect, it } from "vitest";
import {
  InjectSyntaxError,
  addImport,
  applyAnchorPatch,
  insertAfterAnchor,
  validateSyntax,
} from "../src/mutators/file-injector.js";
import { SERVER_FIXTURE } from "./fixtures/server-fixture.js";

describe("FileInjector", () => {
  it("inserts mount after routes anchor", () => {
    const mount = '  app.use("/api/posts", postsRouter);';
    const next = applyAnchorPatch(SERVER_FIXTURE, "[ROOT-INJECT:ROUTES]", mount, mount.trim());
    expect(next).toContain('// [ROOT-INJECT:ROUTES]\n  app.use("/api/posts", postsRouter);');
    expect(next.indexOf('app.use("/api/posts", postsRouter)')).toBeLessThan(
      next.indexOf("app.use(errorHandler)"),
    );
  });

  it("adds a default import when none exist", () => {
    const source = "export const x = 1;\n";
    const once = addImport(source, {
      source: "express",
      specifiers: ["express"],
      isDefault: true,
    });
    expect(once.changed).toBe(true);
    expect(once.content).toContain('import express from "express"');
    const twice = addImport(once.content, {
      source: "express",
      specifiers: ["express"],
      isDefault: true,
    });
    expect(twice.changed).toBe(false);
  });

  it("is idempotent for anchor mounts", () => {
    const mount = '  app.use("/api/posts", postsRouter);';
    const once = applyAnchorPatch(SERVER_FIXTURE, "[ROOT-INJECT:ROUTES]", mount, mount);
    const twice = applyAnchorPatch(once, "[ROOT-INJECT:ROUTES]", mount, mount);
    expect(twice).toBe(once);
    expect(twice.match(/app\.use\("\/api\/posts"/g)?.length).toBe(1);
  });

  it("adds AST import once", () => {
    const once = addImport(SERVER_FIXTURE, {
      source: "./routes/posts.routes.js",
      specifiers: ["postsRouter"],
    });
    expect(once.changed).toBe(true);
    expect(once.content).toContain('import { postsRouter } from "./routes/posts.routes.js"');

    const twice = addImport(once.content, {
      source: "./routes/posts.routes.js",
      specifiers: ["postsRouter"],
    });
    expect(twice.changed).toBe(false);
    expect(twice.content.match(/postsRouter/g)?.length).toBe(
      once.content.match(/postsRouter/g)?.length,
    );
  });

  it("rejects broken syntax before callers commit", () => {
    expect(() => validateSyntax("const x = {")).toThrow(InjectSyntaxError);
    expect(() =>
      insertAfterAnchor("const x = 1;\n// ANCHOR\n", "ANCHOR", "const y = {"),
    ).not.toThrow();
    expect(() => applyAnchorPatch("const x = 1;\n// ANCHOR\n", "ANCHOR", "const y = {")).toThrow(
      InjectSyntaxError,
    );
    expect(() => insertAfterAnchor("nope", "MISSING", "x")).toThrow(/Anchor not found/);
  });
});

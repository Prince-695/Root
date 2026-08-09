import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  RootJsonValidationError,
  createRootJsonFixture,
  loadRootJson,
  parseRootJson,
  serializeRootJson,
  writeRootJson,
} from "../src/config/root-json.js";

describe("root.json config", () => {
  it("parses a valid fixture", () => {
    const config = createRootJsonFixture({ projectName: "demo-api" });
    expect(config.projectName).toBe("demo-api");
    expect(config.framework).toBe("express");
    expect(config.inject.routesAnchor).toBe("[ROOT-INJECT:ROUTES]");
  });

  it("rejects missing required fields with field paths", () => {
    expect(() => parseRootJson({ projectName: "x" })).toThrow(RootJsonValidationError);
    try {
      parseRootJson({ projectName: "x" });
    } catch (error) {
      expect(error).toBeInstanceOf(RootJsonValidationError);
      const typed = error as RootJsonValidationError;
      expect(typed.message).toContain("language");
      expect(typed.issues.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid enum values with field path", () => {
    const bad = createRootJsonFixture();
    expect(() =>
      parseRootJson({
        ...bad,
        orm: "typeorm",
      }),
    ).toThrow(/orm/);
  });

  it("round-trips serialize → parse", () => {
    const config = createRootJsonFixture({ auth: "jwt" });
    const again = parseRootJson(JSON.parse(serializeRootJson(config)));
    expect(again.auth).toBe("jwt");
    expect(again.modules).toEqual({});
  });

  it("loads and writes root.json on disk", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-json-"));
    const config = createRootJsonFixture({ projectName: "disk-api" });
    const written = await writeRootJson(dir, config);
    expect(written).toBe(path.join(dir, "root.json"));

    const raw = await readFile(written, "utf8");
    expect(raw).toContain("disk-api");

    const loaded = await loadRootJson(dir);
    expect(loaded.projectName).toBe("disk-api");
  });

  it("fails loadRootJson when file missing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-missing-"));
    await expect(loadRootJson(dir)).rejects.toThrow(/No root\.json/);
  });

  it("fails loadRootJson on invalid JSON syntax", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-badjson-"));
    await writeFile(path.join(dir, "root.json"), "{not-json", "utf8");
    await expect(loadRootJson(dir)).rejects.toThrow(/Failed to parse/);
  });

  it("fails loadRootJson on schema-invalid JSON object", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-schema-"));
    await writeFile(path.join(dir, "root.json"), JSON.stringify({ projectName: "only" }), "utf8");
    await expect(loadRootJson(dir)).rejects.toThrow(RootJsonValidationError);
  });
});

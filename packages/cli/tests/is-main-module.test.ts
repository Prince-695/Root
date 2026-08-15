import { chmodSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { isMainModule } from "../src/is-main-module.js";

describe("isMainModule (npx bin shims)", () => {
  it("returns false when argv[1] is missing", () => {
    expect(isMainModule(undefined, import.meta.url)).toBe(false);
  });

  it("returns false for an unrelated file", () => {
    expect(isMainModule("/tmp/not-the-cli.js", import.meta.url)).toBe(false);
  });

  it("treats a symlink entry (npx/npm .bin) as the main module", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rooot-npx-"));
    const realFile = path.join(dir, "cli.js");
    const shim = path.join(dir, "rooot");
    writeFileSync(realFile, "#!/usr/bin/env node\n", "utf8");
    chmodSync(realFile, 0o755);
    symlinkSync(realFile, shim);

    expect(isMainModule(shim, pathToFileURL(realFile).href)).toBe(true);
    expect(isMainModule(realFile, pathToFileURL(realFile).href)).toBe(true);
  });
});

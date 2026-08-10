#!/usr/bin/env node
/**
 * Prepare the publish directory, `npm pack`, and assert required contents.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execSync("node scripts/prepare-publish.mjs", { cwd: root, stdio: "inherit" });

const releaseDir = path.join(root, "release", "rootcli");
const packDir = mkdtempSync(path.join(tmpdir(), "rootcli-pack-"));

try {
  const packOut = execSync("npm pack --json", {
    cwd: releaseDir,
    encoding: "utf8",
  });
  const [{ filename }] = JSON.parse(packOut);
  const tarball = path.join(releaseDir, filename);
  execSync(`tar -xzf ${JSON.stringify(tarball)} -C ${JSON.stringify(packDir)}`, {
    stdio: "inherit",
  });

  const base = path.join(packDir, "package");
  const required = [
    "package.json",
    "dist/cli.js",
    "vendor/core/dist/index.js",
    "vendor/core/templates/express-ts/src/server.ts.hbs",
    "vendor/core/templates/express-js/src/server.js.hbs",
  ];

  const missing = required.filter((rel) => {
    try {
      readFileSync(path.join(base, rel));
      return false;
    } catch {
      return true;
    }
  });

  if (missing.length > 0) {
    console.error("Pack audit FAILED. Missing:");
    for (const m of missing) console.error(`  - ${m}`);
    console.error("Pack root entries:", readdirSync(base));
    process.exit(1);
  }

  const cliJs = readFileSync(path.join(base, "dist/cli.js"), "utf8");
  if (cliJs.includes("@root/core")) {
    console.error("Pack audit FAILED: dist/cli.js still imports @root/core (rewrite missing)");
    process.exit(1);
  }
  if (!cliJs.includes("vendor/core")) {
    console.error("Pack audit FAILED: dist/cli.js missing vendored core import");
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(path.join(base, "package.json"), "utf8"));
  if (pkg.name !== "rootcli" || !pkg.bin?.rootcli || !pkg.bin?.root) {
    console.error(
      "Pack audit FAILED: bad package.json name/bin (expected rootcli + bins rootcli/root)",
    );
    process.exit(1);
  }

  const cliMode = statSync(path.join(base, "dist/cli.js")).mode & 0o111;
  if (!cliMode) {
    console.error("Pack audit FAILED: dist/cli.js is not executable (npm publish would drop bins)");
    process.exit(1);
  }

  console.log("Pack audit OK");
  console.log(`  name: ${pkg.name}@${pkg.version}`);
  console.log(`  tarball: ${tarball}`);
} finally {
  rmSync(packDir, { recursive: true, force: true });
}

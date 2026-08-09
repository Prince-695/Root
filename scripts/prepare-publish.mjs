#!/usr/bin/env node
import { execSync } from "node:child_process";
/**
 * Build a self-contained publish directory for `root-scaffold`.
 *
 * Unscoped `root` / `root-cli` are taken on npm. Public preview package:
 * `root-scaffold` (bin: root). Core is vendored + CLI imports rewritten so a
 * single tarball works with `pnpm dlx` (npm pack strips nested node_modules).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "release", "root-scaffold");
const version = "0.1.0";

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function walkFiles(dir) {
  const outFiles = [];
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) {
      outFiles.push(...walkFiles(abs));
    } else {
      outFiles.push(abs);
    }
  }
  return outFiles;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

console.log("Building CLI + core…");
execSync("pnpm exec turbo run build --filter=@root/cli", { cwd: root, stdio: "inherit" });

rmSync(out, { recursive: true, force: true });
mkdirSync(path.join(out, "dist"), { recursive: true });
mkdirSync(path.join(out, "vendor", "core"), { recursive: true });

cpSync(path.join(root, "packages/cli/dist"), path.join(out, "dist"), { recursive: true });
cpSync(path.join(root, "packages/core/dist"), path.join(out, "vendor/core/dist"), {
  recursive: true,
});
cpSync(path.join(root, "packages/core/templates"), path.join(out, "vendor/core/templates"), {
  recursive: true,
});

writeFileSync(
  path.join(out, "vendor/core/package.json"),
  `${JSON.stringify(
    {
      name: "@root/core",
      version,
      type: "module",
      main: "./dist/index.js",
      exports: { ".": "./dist/index.js" },
    },
    null,
    2,
  )}\n`,
);

const coreEntry = path.join(out, "vendor/core/dist/index.js");
for (const file of walkFiles(path.join(out, "dist"))) {
  if (!file.endsWith(".js")) continue;
  let src = readFileSync(file, "utf8");
  if (!src.includes("@root/core")) continue;
  let rel = toPosix(path.relative(path.dirname(file), coreEntry));
  if (!rel.startsWith(".")) rel = `./${rel}`;
  src = src
    .replaceAll('"@root/core"', JSON.stringify(rel))
    .replaceAll("'@root/core'", JSON.stringify(rel));
  writeFileSync(file, src);
}

const cliPkg = readJson(path.join(root, "packages/cli/package.json"));
const corePkg = readJson(path.join(root, "packages/core/package.json"));

const published = {
  name: "root-scaffold",
  version,
  description:
    "Root — pure-engineering backend scaffolding CLI (shadcn-style for backend). Bin: root.",
  type: "module",
  bin: {
    root: "./dist/cli.js",
  },
  files: ["dist", "vendor"],
  engines: {
    node: "^22.18.0 || >=24",
  },
  publishConfig: {
    access: "public",
  },
  keywords: ["cli", "scaffold", "express", "backend", "root"],
  license: "MIT",
  dependencies: {
    "@clack/prompts": cliPkg.dependencies["@clack/prompts"],
    commander: cliPkg.dependencies.commander,
    ...corePkg.dependencies,
  },
};

writeFileSync(path.join(out, "package.json"), `${JSON.stringify(published, null, 2)}\n`);

const licenseSrc = path.join(root, "LICENSE");
if (existsSync(licenseSrc)) {
  cpSync(licenseSrc, path.join(out, "LICENSE"));
}

writeFileSync(
  path.join(out, "README.md"),
  `# root-scaffold

Pure-engineering backend scaffolding CLI (**no AI**).

\`\`\`bash
mkdir my-api && cd my-api
pnpm dlx root-scaffold@latest init
pnpm dlx root-scaffold@latest add auth
pnpm dlx root-scaffold@latest add route post
pnpm dlx root-scaffold@latest doctor
\`\`\`

> npm name note: unscoped \`root\` is already taken on the registry, so the publishable
> package is \`root-scaffold\` (bin still named \`root\`).

Local monorepo development uses \`pnpm root-cli\` instead of dlx.
`,
);

console.log(`Prepared publish pack at ${out}`);

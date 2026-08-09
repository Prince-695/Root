import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const relativePath = process.argv[2];
if (!relativePath) {
  console.error("Usage: node scripts/add-bin-shebang.mjs <path-to-cli.js>");
  process.exit(1);
}

const filePath = resolve(process.cwd(), relativePath);
const contents = readFileSync(filePath, "utf8");
const shebang = "#!/usr/bin/env node\n";

if (!contents.startsWith(shebang)) {
  writeFileSync(filePath, shebang + contents, "utf8");
}

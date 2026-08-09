import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
  const checks: Array<[PackageManager, string]> = [
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
    ["bun", "bun.lockb"],
    ["npm", "package-lock.json"],
  ];

  for (const [pm, file] of checks) {
    try {
      await access(path.join(cwd, file));
      return pm;
    } catch {
      // continue
    }
  }

  // Prefer pnpm when invoking via pnpm dlx; otherwise npm.
  if (process.env.npm_config_user_agent?.includes("pnpm")) return "pnpm";
  if (process.env.npm_config_user_agent?.includes("yarn")) return "yarn";
  if (process.env.npm_config_user_agent?.includes("bun")) return "bun";
  return "pnpm";
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

export async function installDependencies(targetDir: string, pm: PackageManager): Promise<void> {
  switch (pm) {
    case "pnpm":
      await run("pnpm", ["install"], targetDir);
      await run("pnpm", ["exec", "prisma", "generate"], targetDir);
      break;
    case "yarn":
      await run("yarn", ["install"], targetDir);
      await run("yarn", ["prisma", "generate"], targetDir);
      break;
    case "bun":
      await run("bun", ["install"], targetDir);
      await run("bunx", ["prisma", "generate"], targetDir);
      break;
    default:
      await run("npm", ["install"], targetDir);
      await run("npx", ["prisma", "generate"], targetDir);
  }
}

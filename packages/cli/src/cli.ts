#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { getEngineBanner } from "@root/core";
import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("root")
    .description(
      "Pure-engineering backend scaffolding CLI (shadcn-style for backend). Primary UX: pnpm dlx root@latest",
    )
    .version("0.0.0")
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("--dry-run", "Preview actions without writing files", false)
    .option("--yes", "Skip confirmation prompts where safe", false);

  program.addHelpText("beforeAll", `${getEngineBanner()}\n`);

  registerInitCommand(program);
  registerAddCommand(program);
  registerDoctorCommand(program);

  return program;
}

export async function run(argv: string[] = process.argv): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv);
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}

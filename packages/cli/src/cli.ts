#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { getEngineBanner } from "@root/core";
import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerDiffCommand } from "./commands/diff.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerInspectCommand } from "./commands/inspect.js";
import { registerListCommand } from "./commands/list.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerSyncCommand } from "./commands/sync.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("root")
    .description(
      "Pure-engineering backend scaffolding CLI. Primary UX: npx rootcli@latest <command>",
    )
    .version("0.1.0")
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("--dry-run", "Preview actions without writing files", false)
    .option("--yes", "Skip confirmation prompts where safe", false);

  program.addHelpText("beforeAll", `${getEngineBanner()}\n`);
  program.addHelpText(
    "after",
    [
      "",
      "Examples:",
      "  $ npx rootcli@latest init",
      "  $ npx rootcli@latest add auth",
      "  $ npx rootcli@latest add resource post",
      "  $ npx rootcli@latest list",
      "  $ npx rootcli@latest doctor",
      "  $ npx rootcli@latest --dry-run add resource comment",
      "",
      "Also: pnpm dlx rootcli@latest … · yarn dlx rootcli@latest … · bunx rootcli@latest …",
    ].join("\n"),
  );

  registerInitCommand(program);
  registerAddCommand(program);
  registerRemoveCommand(program);
  registerListCommand(program);
  registerInspectCommand(program);
  registerDiffCommand(program);
  registerDoctorCommand(program);
  registerSyncCommand(program);

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

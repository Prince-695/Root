#!/usr/bin/env node
import { ROOT_NPM_PACKAGE, getEngineBanner, rootInvoke, rootInvokeAll } from "@root/core";
import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerDiffCommand } from "./commands/diff.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerInspectCommand } from "./commands/inspect.js";
import { registerListCommand } from "./commands/list.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerSyncCommand } from "./commands/sync.js";
import { isMainModule } from "./is-main-module.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name(ROOT_NPM_PACKAGE)
    .description(`Pure-engineering backend scaffolding CLI. Primary UX: ${rootInvoke("<command>")}`)
    .version("0.1.1")
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("--dry-run", "Preview actions without writing files", false)
    .option("--yes", "Skip confirmation prompts where safe", false);

  program.addHelpText("beforeAll", `${getEngineBanner()}\n`);
  program.addHelpText(
    "after",
    [
      "",
      "Examples:",
      `  $ ${rootInvoke("init")}`,
      `  $ ${rootInvoke("add auth")}`,
      `  $ ${rootInvoke("add resource post")}`,
      `  $ ${rootInvoke("list")}`,
      `  $ ${rootInvoke("doctor")}`,
      `  $ ${rootInvoke("--dry-run add resource comment")}`,
      "",
      `Also: ${rootInvokeAll("").join(" · ")}`,
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

if (isMainModule(process.argv[1], import.meta.url)) {
  run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}

import type { Command } from "commander";

export type GlobalFlags = {
  verbose: boolean;
  dryRun: boolean;
  yes: boolean;
};

export function getGlobalFlags(command: Command): GlobalFlags {
  const opts = command.optsWithGlobals() as {
    verbose?: boolean;
    dryRun?: boolean;
    yes?: boolean;
  };

  return {
    verbose: Boolean(opts.verbose),
    dryRun: Boolean(opts.dryRun),
    yes: Boolean(opts.yes),
  };
}

export function logVerbose(flags: GlobalFlags, message: string): void {
  if (flags.verbose) {
    console.error(`[verbose] ${message}`);
  }
}

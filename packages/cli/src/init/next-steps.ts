import type { InitAnswers } from "@root/core";

/**
 * Language-aware post-init instructions (never hardcode Node for Python/Go).
 */
export function buildInitNextSteps(options: {
  targetDir: string;
  answers: InitAnswers;
  adoptExisting: boolean;
  skipInstall: boolean;
  /** True when install already succeeded during init. */
  installed?: boolean;
}): string {
  const { targetDir, answers, adoptExisting, skipInstall, installed = false } = options;
  const lines: Array<string | undefined> = [
    `Project ready at ${targetDir}`,
    "",
    "Next steps:",
    `  cd ${targetDir}`,
  ];

  if (answers.language === "python") {
    if (!adoptExisting) {
      lines.push("  python -m venv .venv");
      lines.push("  source .venv/bin/activate   # Windows: .venv\\Scripts\\activate");
      if (!installed) {
        if (answers.packageManager === "uv") {
          lines.push("  uv pip install -r requirements.txt");
        } else {
          lines.push("  pip install -r requirements.txt");
        }
      }
      if (answers.framework === "fastapi") {
        lines.push("  uvicorn app.main:app --reload");
      } else if (answers.framework === "flask") {
        lines.push("  flask --app app run --debug");
      } else {
        lines.push("  python app.py");
      }
    }
    lines.push("", "Then (CLI still via npx — your app stays pure Python):");
    lines.push("  npx rootcli@latest doctor");
    if (!adoptExisting) {
      lines.push("  npx rootcli@latest add docker   # if needed");
    }
    return lines.filter((l): l is string => l !== undefined).join("\n");
  }

  if (answers.language === "go") {
    if (!adoptExisting) {
      if (!installed) {
        lines.push("  go mod tidy");
      }
      lines.push("  go run .");
    }
    lines.push("", "Then (CLI still via npx — your app stays pure Go):");
    lines.push("  npx rootcli@latest doctor");
    if (!adoptExisting) {
      lines.push("  npx rootcli@latest add docker   # if needed");
    }
    return lines.filter((l): l is string => l !== undefined).join("\n");
  }

  // Node (TypeScript / JavaScript)
  if (!adoptExisting) {
    lines.push("  cp .env.example .env");
  }
  if (answers.docker) {
    lines.push("  docker compose up -d");
  }
  const pm = answers.packageManager;
  if ((skipInstall || !installed) && !adoptExisting && isNodePm(pm)) {
    lines.push(`  ${pm} install`);
  }
  if (!adoptExisting) {
    lines.push(`  ${nodeDevCommand(pm)}`);
  }
  lines.push("", "Then:");
  if (answers.auth !== "jwt" && !adoptExisting) {
    lines.push("  npx rootcli@latest add auth");
  }
  lines.push("  npx rootcli@latest add resource post");
  lines.push("  npx rootcli@latest add docker   # if needed");

  return lines.filter((l): l is string => l !== undefined).join("\n");
}

function isNodePm(pm: InitAnswers["packageManager"]): boolean {
  return pm === "npm" || pm === "pnpm" || pm === "yarn" || pm === "bun";
}

function nodeDevCommand(pm: InitAnswers["packageManager"]): string {
  switch (pm) {
    case "npm":
      return "npm run dev";
    case "yarn":
      return "yarn dev";
    case "bun":
      return "bun run dev";
    default:
      return "pnpm dev";
  }
}

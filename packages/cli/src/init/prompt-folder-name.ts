import * as p from "@clack/prompts";
import { defaultFolderPlaceholder, isValidFolderName } from "./folder-name.js";

export type FolderNamePrompt = (cwd: string) => Promise<string | null>;

/**
 * Ask for a project folder name (shadcn-style).
 * Returns `null` when the user presses Escape / cancels → stay in current folder.
 */
export const promptFolderName: FolderNamePrompt = async (cwd) => {
  const placeholder = defaultFolderPlaceholder(cwd);

  const value = await p.text({
    message: "What is your project / folder name?",
    placeholder,
    validate: (input) => {
      const trimmed = (input ?? "").trim();
      if (!trimmed) {
        return "Enter a folder name, or press Escape to use the current folder.";
      }
      if (!isValidFolderName(trimmed)) {
        return "Use lowercase letters, numbers, and hyphens only (e.g. my-api).";
      }
    },
  });

  if (p.isCancel(value)) {
    p.cancel("Using current folder.");
    return null;
  }

  return value.trim();
};

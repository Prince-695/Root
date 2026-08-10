import { writeRootJson } from "../config/root-json.js";
import {
  type InitAnswers,
  answersToRootJson,
  isSupportedExpressStack,
  unsupportedStackMessage,
} from "./answers.js";

export type AdoptResult = {
  filesWritten: string[];
  rootJsonPath: string;
};

/**
 * Adopt an existing Node project: write root.json only (no template overwrite).
 */
export async function adoptExistingProject(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<AdoptResult> {
  const { targetDir, answers } = options;
  if (!isSupportedExpressStack(answers)) {
    throw new Error(unsupportedStackMessage(answers));
  }

  const rootJson = answersToRootJson({ ...answers, adoptExisting: true });
  // Prefer no docker/github flags mutating tree on adopt unless user asked —
  // features still recorded in manifest for later `add docker`.
  const rootJsonPath = await writeRootJson(targetDir, rootJson);
  return { filesWritten: ["root.json"], rootJsonPath };
}

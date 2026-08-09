import { type DetectedProject, ERRORS, detectProject } from "@root/core";

export type RootProjectDetected = Extract<DetectedProject, { kind: "root-project" }>;

/**
 * Resolve cwd as a valid Root project, or print an error and set exitCode.
 */
export async function requireRootProject(
  cwd: string,
  commandLabel: string,
): Promise<RootProjectDetected | null> {
  const detected = await detectProject(cwd);

  if (detected.kind === "empty-safe" || detected.kind === "foreign") {
    console.error(ERRORS.commandRequiresRootProject(detected.cwd, commandLabel));
    process.exitCode = 1;
    return null;
  }

  if (detected.kind === "root-project-invalid") {
    console.error(ERRORS.addInvalidRootJson(detected.error.message));
    process.exitCode = 1;
    return null;
  }

  return detected;
}

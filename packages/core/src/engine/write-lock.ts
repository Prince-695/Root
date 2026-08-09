import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const ROOT_LOCK_FILENAME = ".root.lock" as const;

/** Stale lock threshold (ms). */
const STALE_MS = 5 * 60 * 1000;

export class WriteLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WriteLockError";
  }
}

type LockPayload = {
  pid: number;
  createdAt: string;
};

/**
 * Single-writer lock for Root modify operations.
 * Concurrent Root processes refuse to write while another hold is active.
 */
export async function withProjectWriteLock<T>(
  projectRoot: string,
  fn: () => Promise<T>,
): Promise<T> {
  const lockPath = path.join(projectRoot, ROOT_LOCK_FILENAME);
  await mkdir(projectRoot, { recursive: true });

  try {
    const existing = await readFile(lockPath, "utf8");
    let payload: LockPayload | null = null;
    try {
      payload = JSON.parse(existing) as LockPayload;
    } catch {
      payload = null;
    }
    const age = payload ? Date.now() - Date.parse(payload.createdAt) : Number.POSITIVE_INFINITY;
    if (payload && Number.isFinite(age) && age < STALE_MS) {
      throw new WriteLockError(
        [
          `Another Root process appears to be modifying this project (lock: ${ROOT_LOCK_FILENAME}, pid ${payload.pid}).`,
          "",
          "Root assumes a single writer. Wait for the other process, or remove a stale lock if no Root CLI is running:",
          `  rm ${ROOT_LOCK_FILENAME}`,
        ].join("\n"),
      );
    }
    await rm(lockPath, { force: true });
  } catch (error) {
    if (error instanceof WriteLockError) {
      throw error;
    }
    // ENOENT — no lock
  }

  const payload: LockPayload = {
    pid: process.pid,
    createdAt: new Date().toISOString(),
  };
  await writeFile(lockPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  try {
    return await fn();
  } finally {
    await rm(lockPath, { force: true });
  }
}

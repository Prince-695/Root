import { access } from "node:fs/promises";
import path from "node:path";
import { loadRootJson } from "../config/root-json.js";
import type { Operation } from "../engine/operations.js";
import { type TransactionOptions, applyOperations } from "../engine/transaction.js";
import { withProjectWriteLock } from "../engine/write-lock.js";
import { sourceExtension } from "../providers/language.js";
import { assertNodeStackCapability } from "../providers/stack-guards.js";
import { toCamelCase, toPascalCase } from "../registry/types.js";

export type CapabilityKind =
  | "cache"
  | "queue"
  | "storage"
  | "websocket"
  | "logging"
  | "health"
  | "rate-limit";

export class AddCapabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddCapabilityError";
  }
}

export type AddCapabilityOptions = {
  projectRoot: string;
  kind: CapabilityKind;
  /** Optional subtype e.g. redis, s3, bullmq */
  name?: string;
  dryRun?: boolean;
} & TransactionOptions;

export type AddCapabilityResult = {
  ops: Operation[];
  kind: CapabilityKind;
  slug: string;
  alreadyPresent: boolean;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function defaultSubtype(kind: CapabilityKind, name?: string): string {
  if (name?.trim()) return name.trim().toLowerCase();
  switch (kind) {
    case "cache":
      return "redis";
    case "queue":
      return "memory";
    case "storage":
      return "local";
    case "websocket":
      return "ws";
    case "logging":
      return "pino";
    case "health":
      return "health";
    case "rate-limit":
      return "memory";
    default:
      return "default";
  }
}

function buildCapabilitySource(
  kind: CapabilityKind,
  subtype: string,
  ext: "ts" | "js",
): { relPath: string; content: string; dep?: { name: string; version: string } } {
  const pascal = toPascalCase(`${kind}-${subtype}`);
  const camel = toCamelCase(`${kind}-${subtype}`);

  if (kind === "cache") {
    const relPath = `src/lib/cache.${ext}`;
    const content =
      ext === "ts"
        ? `/** Root capability: cache (${subtype}) — replace with real ${subtype} client as needed. */
export type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
};

const store = new Map<string, { value: string; expiresAt?: number }>();

export const ${camel}: CacheClient = {
  async get(key) {
    const hit = store.get(key);
    if (!hit) return null;
    if (hit.expiresAt && Date.now() > hit.expiresAt) {
      store.delete(key);
      return null;
    }
    return hit.value;
  },
  async set(key, value, ttlSeconds) {
    store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },
};

export type ${pascal} = typeof ${camel};
`
        : `/** Root capability: cache (${subtype}) */
const store = new Map();

export const ${camel} = {
  async get(key) {
    const hit = store.get(key);
    if (!hit) return null;
    if (hit.expiresAt && Date.now() > hit.expiresAt) {
      store.delete(key);
      return null;
    }
    return hit.value;
  },
  async set(key, value, ttlSeconds) {
    store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },
};
`;
    const result: { relPath: string; content: string; dep?: { name: string; version: string } } = {
      relPath,
      content,
    };
    if (subtype === "redis") {
      result.dep = { name: "ioredis", version: "^5.4.2" };
    }
    return result;
  }

  if (kind === "queue") {
    return {
      relPath: `src/lib/queue.${ext}`,
      content:
        ext === "ts"
          ? `/** Root capability: queue (${subtype}) */
type Job = { id: string; name: string; payload: unknown };

const jobs: Job[] = [];

export async function enqueue(name: string, payload: unknown): Promise<Job> {
  const job = { id: String(jobs.length + 1), name, payload };
  jobs.push(job);
  return job;
}

export async function drain(): Promise<Job[]> {
  return jobs.splice(0, jobs.length);
}
`
          : `/** Root capability: queue (${subtype}) */
const jobs = [];

export async function enqueue(name, payload) {
  const job = { id: String(jobs.length + 1), name, payload };
  jobs.push(job);
  return job;
}

export async function drain() {
  return jobs.splice(0, jobs.length);
}
`,
    };
  }

  if (kind === "storage") {
    return {
      relPath: `src/lib/storage.${ext}`,
      content:
        ext === "ts"
          ? `import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Root capability: storage (${subtype}) */
export async function putObject(key: string, body: Buffer | string): Promise<string> {
  const root = path.join(process.cwd(), ".data", "storage");
  await mkdir(root, { recursive: true });
  const target = path.join(root, key.replace(/\\\\/g, "/"));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  return target;
}
`
          : `import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Root capability: storage (${subtype}) */
export async function putObject(key, body) {
  const root = path.join(process.cwd(), ".data", "storage");
  await mkdir(root, { recursive: true });
  const target = path.join(root, key.replace(/\\\\/g, "/"));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  return target;
}
`,
    };
  }

  if (kind === "websocket") {
    return {
      relPath: `src/lib/websocket.${ext}`,
      content:
        ext === "ts"
          ? `/** Root capability: websocket (${subtype}) — wire to your HTTP server. */
export type WsMessage = { type: string; payload?: unknown };

export function createWsHub() {
  const clients = new Set<(msg: WsMessage) => void>();
  return {
    subscribe(handler: (msg: WsMessage) => void) {
      clients.add(handler);
      return () => clients.delete(handler);
    },
    broadcast(msg: WsMessage) {
      for (const client of clients) client(msg);
    },
  };
}
`
          : `/** Root capability: websocket (${subtype}) */
export function createWsHub() {
  const clients = new Set();
  return {
    subscribe(handler) {
      clients.add(handler);
      return () => clients.delete(handler);
    },
    broadcast(msg) {
      for (const client of clients) client(msg);
    },
  };
}
`,
      dep: { name: "ws", version: "^8.18.0" },
    };
  }

  if (kind === "logging") {
    return {
      relPath: `src/lib/logging.${ext}`,
      content:
        ext === "ts"
          ? `/** Root capability: logging (${subtype}) */
export const log = {
  info: (...args: unknown[]) => console.info("[info]", ...args),
  warn: (...args: unknown[]) => console.warn("[warn]", ...args),
  error: (...args: unknown[]) => console.error("[error]", ...args),
};
`
          : `/** Root capability: logging (${subtype}) */
export const log = {
  info: (...args) => console.info("[info]", ...args),
  warn: (...args) => console.warn("[warn]", ...args),
  error: (...args) => console.error("[error]", ...args),
};
`,
    };
  }

  if (kind === "rate-limit") {
    return {
      relPath: `src/middleware/rateLimit.${ext}`,
      content:
        ext === "ts"
          ? `import type { NextFunction, Request, Response } from "express";

/** Root capability: rate-limit (${subtype}) */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(options: { windowMs?: number; max?: number } = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 100;
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || now > cur.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    cur.count += 1;
    if (cur.count > max) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}
`
          : `/** Root capability: rate-limit (${subtype}) */
const hits = new Map();

export function rateLimit(options = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 100;
  return (req, res, next) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || now > cur.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    cur.count += 1;
    if (cur.count > max) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}
`,
    };
  }

  // health — reinforce existing health module marker
  return {
    relPath: `src/lib/health.${ext}`,
    content:
      ext === "ts"
        ? `/** Root capability: health */
export function healthPayload() {
  return { ok: true, ts: new Date().toISOString() };
}
`
        : `/** Root capability: health */
export function healthPayload() {
  return { ok: true, ts: new Date().toISOString() };
}
`,
  };
}

export async function addCapability(options: AddCapabilityOptions): Promise<AddCapabilityResult> {
  const { projectRoot, kind, dryRun = false } = options;
  const config = await loadRootJson(projectRoot);
  assertNodeStackCapability(config, kind);
  const subtype = defaultSubtype(kind, options.name);
  const moduleName = `${kind}:${subtype}`;

  if (config.modules[moduleName] || config.modules[kind]) {
    return { ops: [], kind, slug: subtype, alreadyPresent: true };
  }

  const ext = sourceExtension(config);
  const built = buildCapabilitySource(kind, subtype, ext);
  const ops: Operation[] = [];
  const addedAt = new Date().toISOString();

  const full = path.join(projectRoot, built.relPath);
  if (!(await exists(full))) {
    ops.push({ type: "createFile", path: built.relPath, content: built.content });
  }
  if (built.dep) {
    ops.push({
      type: "ensureDependency",
      name: built.dep.name,
      version: built.dep.version,
    });
  }
  ops.push({
    type: "updateManifest",
    moduleName,
    entry: { type: kind, addedAt },
  });

  if (dryRun) {
    return { ops, kind, slug: subtype, alreadyPresent: false };
  }

  await withProjectWriteLock(projectRoot, async () => {
    await applyOperations(projectRoot, ops, options);
  });

  return { ops, kind, slug: subtype, alreadyPresent: false };
}

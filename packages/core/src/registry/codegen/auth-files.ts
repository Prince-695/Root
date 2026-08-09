import type { RootJson } from "../../config/root-json.js";
import { isTypeScript, sourceExtension } from "../../providers/language.js";

export type AuthFileBundle = {
  middlewarePath: string;
  middlewareContent: string;
  routePath: string;
  routeContent: string;
  controllerPath: string;
  controllerContent: string;
  servicePath: string;
  serviceContent: string;
  typesPath: string;
  typesContent: string;
};

export function buildAuthFiles(config: RootJson): AuthFileBundle {
  const ext = sourceExtension(config);
  const ts = isTypeScript(config);
  const mwDir = config.aliases.middleware;
  const routesDir = config.aliases.routes;
  const controllersDir = config.aliases.controllers;
  const servicesDir = config.aliases.services;

  const routeContent = `import { Router } from "express";
import { signIn, signOut, signUp } from "../controllers/auth.controller.js";
import { signInSchema, signUpSchema } from "../schema.js";
import { validate } from "../middleware/validate.js";

export const authRouter = Router();

authRouter.post("/signup", validate(signUpSchema), signUp);
authRouter.post("/signin", validate(signInSchema), signIn);
authRouter.post("/signout", signOut);
`;

  return {
    middlewarePath: `${mwDir}/auth.${ext}`,
    middlewareContent: ts ? buildTsAuthMiddleware() : buildJsAuthMiddleware(),
    routePath: `${routesDir}/auth.routes.${ext}`,
    routeContent,
    controllerPath: `${controllersDir}/auth.controller.${ext}`,
    controllerContent: ts ? buildTsAuthController() : buildJsAuthController(),
    servicePath: `${servicesDir}/auth.service.${ext}`,
    serviceContent: buildAuthService(config),
    typesPath: ts ? "src/types/express.d.ts" : "",
    typesContent: ts ? buildAuthTypesContent() : "",
  };
}

function buildTsAuthMiddleware(): string {
  return `import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AuthTokenPayload;
    req.authenticatedUser = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, error: { message: "Invalid or expired token" } });
  }
}
`;
}

function buildJsAuthMiddleware(): string {
  return `import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    req.authenticatedUser = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, error: { message: "Invalid or expired token" } });
  }
}
`;
}

function buildAuthTypesContent(): string {
  return `export {};

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: {
        id: string;
        email: string;
      };
    }
  }
}
`;
}

function buildTsAuthController(): string {
  return `import type { NextFunction, Request, Response } from "express";
import { signInUser, signUpUser } from "../services/auth.service.js";

export async function signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await signUpUser(req.body as { email: string; password: string });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function signIn(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await signInUser(req.body as { email: string; password: string });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function signOut(_req: Request, res: Response) {
  // Stateless JWT — client discards the token.
  res.status(200).json({ success: true, data: { signedOut: true } });
}
`;
}

function buildJsAuthController(): string {
  return `import { signInUser, signUpUser } from "../services/auth.service.js";

export async function signUp(req, res, next) {
  try {
    const result = await signUpUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function signIn(req, res, next) {
  try {
    const result = await signInUser(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function signOut(_req, res) {
  // Stateless JWT — client discards the token.
  res.status(200).json({ success: true, data: { signedOut: true } });
}
`;
}

function statusError(ts: boolean, message: string, status: number): string {
  if (ts) {
    return `const error = new Error("${message}") as Error & { status: number };
    error.status = ${status};
    throw error;`;
  }
  return `const error = new Error("${message}");
    error.status = ${status};
    throw error;`;
}

function buildAuthService(config: RootJson): string {
  const ts = isTypeScript(config);
  const inputParam = ts ? "input: { email: string; password: string }" : "input";
  const signTokenParam = ts ? "user: { id: string; email: string }" : "user";

  const common = `import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function signToken(${signTokenParam}) {
  return jwt.sign({ sub: user.id, email: user.email }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}
`;

  if (config.orm === "prisma") {
    return `${common}import { db } from "../db/client.js";

export async function signUpUser(${inputParam}) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    ${statusError(ts, "Email already registered", 409)}
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await db.user.create({
    data: { email: input.email, passwordHash },
  });
  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}

export async function signInUser(${inputParam}) {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    ${statusError(ts, "Invalid email or password", 401)}
  }
  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}
`;
  }

  if (config.orm === "mongoose") {
    return `${common}import { UserModel } from "../models/user.model.js";

export async function signUpUser(${inputParam}) {
  const existing = await UserModel.findOne({ email: input.email }).lean();
  if (existing) {
    ${statusError(ts, "Email already registered", 409)}
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await UserModel.create({ email: input.email, passwordHash });
  const id = String(user._id);
  const token = signToken({ id, email: user.email });
  return { token, user: { id, email: user.email } };
}

export async function signInUser(${inputParam}) {
  const user = await UserModel.findOne({ email: input.email });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    ${statusError(ts, "Invalid email or password", 401)}
  }
  const id = String(user._id);
  const token = signToken({ id, email: user.email });
  return { token, user: { id, email: user.email } };
}
`;
  }

  if (config.orm === "drizzle") {
    return `${common}import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

export async function signUpUser(${inputParam}) {
  const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (existing[0]) {
    ${statusError(ts, "Email already registered", 409)}
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const rows = await db
    .insert(users)
    .values({ email: input.email, passwordHash })
    .returning();
  const user = rows[0];
  if (!user) {
    throw new Error("Failed to create user");
  }
  const token = signToken({ id: String(user.id), email: user.email });
  return { token, user: { id: String(user.id), email: user.email } };
}

export async function signInUser(${inputParam}) {
  const rows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    ${statusError(ts, "Invalid email or password", 401)}
  }
  const token = signToken({ id: String(user.id), email: user.email });
  return { token, user: { id: String(user.id), email: user.email } };
}
`;
  }

  // in-memory (orm none)
  if (ts) {
    return `${common}
type UserRecord = { id: string; email: string; passwordHash: string };
const users: UserRecord[] = [];

export async function signUpUser(${inputParam}) {
  if (users.some((u) => u.email === input.email)) {
    ${statusError(ts, "Email already registered", 409)}
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: UserRecord = {
    id: crypto.randomUUID(),
    email: input.email,
    passwordHash,
  };
  users.push(user);
  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}

export async function signInUser(${inputParam}) {
  const user = users.find((u) => u.email === input.email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    ${statusError(ts, "Invalid email or password", 401)}
  }
  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}
`;
  }

  return `${common}
const users = [];

export async function signUpUser(${inputParam}) {
  if (users.some((u) => u.email === input.email)) {
    ${statusError(ts, "Email already registered", 409)}
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = {
    id: crypto.randomUUID(),
    email: input.email,
    passwordHash,
  };
  users.push(user);
  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}

export async function signInUser(${inputParam}) {
  const user = users.find((u) => u.email === input.email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    ${statusError(ts, "Invalid email or password", 401)}
  }
  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}
`;
}

export const AUTH_README_SECTION = `
## Authentication

Root installs JWT auth at \`/auth\`.

\`\`\`bash
# Sign up
curl -s -X POST http://localhost:3000/auth/signup \\
  -H 'content-type: application/json' \\
  -d '{"email":"you@example.com","password":"password123"}'

# Sign in
curl -s -X POST http://localhost:3000/auth/signin \\
  -H 'content-type: application/json' \\
  -d '{"email":"you@example.com","password":"password123"}'
\`\`\`

Use the returned token on mutating resource routes:

\`\`\`bash
curl -s -X POST http://localhost:3000/api/post \\
  -H 'content-type: application/json' \\
  -H "authorization: Bearer <token>" \\
  -d '{"title":"hello"}'
\`\`\`

Set \`ACCESS_TOKEN_SECRET\` in \`.env\` (never commit production secrets).
`;

export const ACCESS_TOKEN_ENV_LINE = "ACCESS_TOKEN_SECRET=change-me-to-a-long-random-string";

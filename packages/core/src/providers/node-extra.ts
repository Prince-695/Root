import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { writeRootJson } from "../config/root-json.js";
import { type InitAnswers, answersToRootJson } from "../init/answers.js";
import type { StructureizeResult } from "../init/structureizer.js";

async function write(targetDir: string, rel: string, content: string, files: string[]) {
  const full = path.join(targetDir, rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
  files.push(rel);
}

/** Minimal Hono + TypeScript vertical slice. */
export async function structureizeHonoTs(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<StructureizeResult> {
  const { targetDir, answers } = options;
  const filesWritten: string[] = [];
  const name = answers.projectName;

  await write(
    targetDir,
    "package.json",
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "tsx watch src/index.ts",
          start: "tsx src/index.ts",
        },
        dependencies: {
          hono: "^4.7.2",
          "@hono/node-server": "^1.13.8",
        },
        devDependencies: {
          tsx: "^4.19.3",
          typescript: "^5.8.2",
          "@types/node": "^22.13.10",
        },
      },
      null,
      2,
    ),
    filesWritten,
  );

  await write(
    targetDir,
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          outDir: "dist",
          rootDir: "src",
          skipLibCheck: true,
        },
        include: ["src"],
      },
      null,
      2,
    ),
    filesWritten,
  );

  await write(
    targetDir,
    "src/index.ts",
    `import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

// [ROOT-INJECT:ROUTES]

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(\`Hono listening on :\${port}\`);
`,
    filesWritten,
  );

  await write(targetDir, "README.md", `# ${name}\n\nHono + TypeScript (Root).\n`, filesWritten);

  const rootJson = answersToRootJson({
    ...answers,
    language: "typescript",
    framework: "hono",
  });
  rootJson.aliases = {
    routes: "src",
    controllers: "src",
    services: "src",
    middleware: "src",
    schema: "src/index.ts",
    server: "src/index.ts",
    db: "src",
  };
  const rootJsonPath = await writeRootJson(targetDir, rootJson);
  filesWritten.push("root.json");
  return { filesWritten, rootJsonPath };
}

/** Minimal NestJS-style bootstrap (simplified single-file for Phase 14 gate). */
export async function structureizeNestjsTs(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<StructureizeResult> {
  const { targetDir, answers } = options;
  const filesWritten: string[] = [];
  const name = answers.projectName;

  await write(
    targetDir,
    "package.json",
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        scripts: {
          start: "nest start",
          "start:dev": "nest start --watch",
        },
        dependencies: {
          "@nestjs/common": "^11.0.0",
          "@nestjs/core": "^11.0.0",
          "@nestjs/platform-express": "^11.0.0",
          "reflect-metadata": "^0.2.2",
          rxjs: "^7.8.1",
        },
        devDependencies: {
          "@nestjs/cli": "^11.0.0",
          typescript: "^5.8.2",
        },
      },
      null,
      2,
    ),
    filesWritten,
  );

  await write(
    targetDir,
    "src/main.ts",
    `import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Module, Controller, Get } from "@nestjs/common";

@Controller("health")
class HealthController {
  @Get()
  check() {
    return { ok: true };
  }
}

@Module({ controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`,
    filesWritten,
  );

  await write(targetDir, "README.md", `# ${name}\n\nNestJS (Root minimal slice).\n`, filesWritten);

  const rootJson = answersToRootJson({
    ...answers,
    language: "typescript",
    framework: "nestjs",
  });
  rootJson.aliases = {
    routes: "src",
    controllers: "src",
    services: "src",
    middleware: "src",
    schema: "src/main.ts",
    server: "src/main.ts",
    db: "src",
  };
  const rootJsonPath = await writeRootJson(targetDir, rootJson);
  filesWritten.push("root.json");
  return { filesWritten, rootJsonPath };
}

/** Minimal TypeScript gRPC server stub. */
export async function structureizeGrpcTs(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<StructureizeResult> {
  const { targetDir, answers } = options;
  const filesWritten: string[] = [];
  const name = answers.projectName;

  await write(
    targetDir,
    "package.json",
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: { start: "tsx src/server.ts" },
        dependencies: { "@grpc/grpc-js": "^1.12.6", "@grpc/proto-loader": "^0.7.13" },
        devDependencies: { tsx: "^4.19.3", typescript: "^5.8.2" },
      },
      null,
      2,
    ),
    filesWritten,
  );

  await write(
    targetDir,
    "proto/health.proto",
    `syntax = "proto3";
package root.health;

service Health {
  rpc Check (HealthCheckRequest) returns (HealthCheckResponse);
}

message HealthCheckRequest {}
message HealthCheckResponse { bool ok = 1; }
`,
    filesWritten,
  );

  await write(
    targetDir,
    "src/server.ts",
    `/** Root gRPC stub — load proto/health.proto and implement Health.Check. */
console.log("gRPC scaffold ready — implement server binding for ${name}");
`,
    filesWritten,
  );

  await write(targetDir, "README.md", `# ${name}\n\ngRPC TypeScript (Root).\n`, filesWritten);

  const rootJson = answersToRootJson({
    ...answers,
    language: "typescript",
    framework: "grpc",
  });
  rootJson.aliases = {
    routes: "proto",
    controllers: "src",
    services: "src",
    middleware: "src",
    schema: "proto/health.proto",
    server: "src/server.ts",
    db: "src",
  };
  const rootJsonPath = await writeRootJson(targetDir, rootJson);
  filesWritten.push("root.json");
  return { filesWritten, rootJsonPath };
}

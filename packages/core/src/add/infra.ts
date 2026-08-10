import { access } from "node:fs/promises";
import path from "node:path";
import { type RootJson, loadRootJson, writeRootJson } from "../config/root-json.js";
import type { Operation } from "../engine/operations.js";
import { type TransactionOptions, applyOperations } from "../engine/transaction.js";
import { withProjectWriteLock } from "../engine/write-lock.js";

export type InfraKind = "docker" | "github-actions" | "kubernetes";

export class AddInfraError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddInfraError";
  }
}

export type AddInfraOptions = {
  projectRoot: string;
  kind: InfraKind;
  dryRun?: boolean;
} & TransactionOptions;

export type AddInfraResult = {
  ops: Operation[];
  kind: InfraKind;
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

function dockerComposeContent(config: RootJson): string {
  const name = config.projectName;
  if (config.database === "postgresql") {
    return `services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${name}
    ports:
      - "5432:5432"
    volumes:
      - root_pg_data:/var/lib/postgresql/data

volumes:
  root_pg_data:
`;
  }
  if (config.database === "mysql") {
    return `services:
  mysql:
    image: mysql:8.4
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ${name}
    ports:
      - "3306:3306"
    volumes:
      - root_mysql_data:/var/lib/mysql

volumes:
  root_mysql_data:
`;
  }
  if (config.database === "mongodb") {
    return `services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: root
      MONGO_INITDB_DATABASE: ${name}
    ports:
      - "27017:27017"
    volumes:
      - root_mongo_data:/data/db

volumes:
  root_mongo_data:
`;
  }
  return `# No database Compose service for database=${config.database}\nservices: {}\n`;
}

function githubActionsContent(): string {
  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install
      - run: npm test
`;
}

function kubernetesManifests(config: RootJson): string {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${config.projectName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${config.projectName}
  template:
    metadata:
      labels:
        app: ${config.projectName}
    spec:
      containers:
        - name: api
          image: ${config.projectName}:latest
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: ${config.projectName}
spec:
  selector:
    app: ${config.projectName}
  ports:
    - port: 80
      targetPort: 3000
`;
}

function isAlreadyPresent(config: RootJson, kind: InfraKind): boolean {
  if (kind === "docker") return Boolean(config.features.docker || config.modules.docker);
  if (kind === "github-actions") {
    return Boolean(config.features.githubActions || config.modules["github-actions"]);
  }
  return Boolean(config.features.kubernetes || config.modules.kubernetes);
}

/**
 * Add infrastructure capability (docker | github-actions | kubernetes).
 */
export async function addInfra(options: AddInfraOptions): Promise<AddInfraResult> {
  const { projectRoot, kind, dryRun = false } = options;
  const config = await loadRootJson(projectRoot);

  if (isAlreadyPresent(config, kind)) {
    return { ops: [], kind, alreadyPresent: true };
  }

  const ops: Operation[] = [];
  const addedAt = new Date().toISOString();

  if (kind === "docker") {
    if (config.database === "sqlite" || config.database === "none") {
      throw new AddInfraError(
        `Docker Compose DB service is not applicable for database=${config.database}.`,
      );
    }
    const target = path.join(projectRoot, "docker-compose.yml");
    if (!(await exists(target))) {
      ops.push({
        type: "createFile",
        path: "docker-compose.yml",
        content: dockerComposeContent(config),
      });
    }
    ops.push({
      type: "updateManifest",
      moduleName: "docker",
      entry: { type: "docker", addedAt },
    });
  } else if (kind === "github-actions") {
    const target = path.join(projectRoot, ".github/workflows/ci.yml");
    if (!(await exists(target))) {
      ops.push({
        type: "createFile",
        path: ".github/workflows/ci.yml",
        content: githubActionsContent(),
      });
    }
    ops.push({
      type: "updateManifest",
      moduleName: "github-actions",
      entry: { type: "github-actions", addedAt },
    });
  } else {
    const target = path.join(projectRoot, "k8s/deployment.yaml");
    if (!(await exists(target))) {
      ops.push({
        type: "createFile",
        path: "k8s/deployment.yaml",
        content: kubernetesManifests(config),
      });
    }
    ops.push({
      type: "updateManifest",
      moduleName: "kubernetes",
      entry: { type: "kubernetes", addedAt },
    });
  }

  if (dryRun) {
    return { ops, kind, alreadyPresent: false };
  }

  await withProjectWriteLock(projectRoot, async () => {
    await applyOperations(projectRoot, ops, options);
    const next = await loadRootJson(projectRoot);
    if (kind === "docker") next.features.docker = true;
    if (kind === "github-actions") next.features.githubActions = true;
    if (kind === "kubernetes") next.features.kubernetes = true;
    await writeRootJson(projectRoot, next);
  });

  return { ops, kind, alreadyPresent: false };
}

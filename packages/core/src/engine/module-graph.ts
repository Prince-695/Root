import { access } from "node:fs/promises";
import path from "node:path";
import { type RootJson, loadRootJson } from "../config/root-json.js";

export type ModuleGraphProbe = {
  hasSchemaFile: boolean;
  hasServerFile: boolean;
  hasAuthMiddleware: boolean;
  hasValidateMiddleware: boolean;
};

export type ModuleGraph = {
  projectRoot: string;
  config: RootJson;
  probe: ModuleGraphProbe;
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadModuleGraph(projectRoot: string): Promise<ModuleGraph> {
  const config = await loadRootJson(projectRoot);
  const schemaPath = path.join(projectRoot, config.aliases.schema);
  const serverPath = path.join(projectRoot, config.aliases.server);
  const authMw = path.join(projectRoot, config.aliases.middleware, "auth.ts");
  const validateMw = path.join(projectRoot, config.aliases.middleware, "validate.ts");

  const probe: ModuleGraphProbe = {
    hasSchemaFile: await fileExists(schemaPath),
    hasServerFile: await fileExists(serverPath),
    hasAuthMiddleware: await fileExists(authMw),
    hasValidateMiddleware: await fileExists(validateMw),
  };

  return { projectRoot, config, probe };
}

export function hasModule(graph: ModuleGraph, name: string): boolean {
  return Object.hasOwn(graph.config.modules, name);
}

export function hasAuth(graph: ModuleGraph): boolean {
  return graph.config.auth !== "none" || hasModule(graph, "auth") || graph.probe.hasAuthMiddleware;
}

export function listModules(graph: ModuleGraph): string[] {
  return Object.keys(graph.config.modules).sort();
}

export function resolveAliasPath(graph: ModuleGraph, alias: keyof RootJson["aliases"]): string {
  return path.join(graph.projectRoot, graph.config.aliases[alias]);
}

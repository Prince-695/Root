import { createRequire } from "node:module";
import { parse } from "@babel/parser";
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

/**
 * Babel 7 packages are CJS. Load generate/traverse via require so they work on
 * Node 18/20 (Babel 8 requires Node ^22.18).
 */
const require = createRequire(import.meta.url);

function loadCjsCallable<T>(id: string): T {
  const mod = require(id) as T | { default: T };
  if (typeof mod === "function") {
    return mod;
  }
  if (mod && typeof mod === "object" && "default" in mod && typeof mod.default === "function") {
    return mod.default;
  }
  throw new Error(`Expected callable CJS export from ${id}`);
}

const generate =
  loadCjsCallable<
    (
      ast: t.File,
      opts?: { retainLines?: boolean; compact?: boolean; jsescOption?: { minimal?: boolean } },
    ) => { code: string }
  >("@babel/generator");
const traverse =
  loadCjsCallable<
    (
      parent: t.File,
      opts: {
        ImportDeclaration?: (path: NodePath<t.ImportDeclaration>) => void;
      },
    ) => void
  >("@babel/traverse");

export class InjectSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InjectSyntaxError";
  }
}

export function validateSyntax(source: string, filename = "virtual.ts"): void {
  try {
    parse(source, {
      sourceType: "module",
      plugins: ["typescript"],
      errorRecovery: false,
      sourceFilename: filename,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new InjectSyntaxError(`Syntax validation failed for ${filename}: ${message}`);
  }
}

/**
 * Insert `insertion` on the line immediately after the first line containing `anchor`.
 * Idempotent when `skipIfContains` is already present in the file.
 */
export function insertAfterAnchor(
  content: string,
  anchor: string,
  insertion: string,
  options: { skipIfContains?: string } = {},
): { content: string; changed: boolean } {
  if (options.skipIfContains && content.includes(options.skipIfContains)) {
    return { content, changed: false };
  }

  const lines = content.split("\n");
  const index = lines.findIndex((line) => line.includes(anchor));
  if (index === -1) {
    throw new Error(`Anchor not found: ${anchor}`);
  }

  const insertLines = insertion.replace(/\n$/, "").split("\n");
  lines.splice(index + 1, 0, ...insertLines);
  return { content: lines.join("\n"), changed: true };
}

export type AddImportOptions = {
  source: string;
  specifiers: string[];
  isDefault?: boolean;
};

function hasMatchingImport(
  program: t.File,
  source: string,
  specifiers: string[],
  isDefault: boolean,
): boolean {
  let found = false;
  traverse(program, {
    ImportDeclaration(path) {
      if (path.node.source.value !== source) {
        return;
      }
      if (isDefault) {
        const hasDefault = path.node.specifiers.some((s) => t.isImportDefaultSpecifier(s));
        if (hasDefault) {
          found = true;
        }
        return;
      }
      const names = new Set(
        path.node.specifiers
          .filter((s): s is t.ImportSpecifier => t.isImportSpecifier(s))
          .map((s) => (t.isIdentifier(s.imported) ? s.imported.name : s.imported.value)),
      );
      if (specifiers.every((name) => names.has(name))) {
        found = true;
      }
    },
  });
  return found;
}

/**
 * Insert a named (or default) import via Babel AST. Idempotent if the import already exists.
 */
export function addImport(
  content: string,
  options: AddImportOptions,
): { content: string; changed: boolean } {
  const ast = parse(content, {
    sourceType: "module",
    plugins: ["typescript"],
    errorRecovery: false,
  });

  const isDefault = options.isDefault ?? false;
  if (hasMatchingImport(ast, options.source, options.specifiers, isDefault)) {
    return { content, changed: false };
  }

  const specifiers = isDefault
    ? [t.importDefaultSpecifier(t.identifier(options.specifiers[0] ?? "defaultExport"))]
    : options.specifiers.map((name) => t.importSpecifier(t.identifier(name), t.identifier(name)));

  const decl = t.importDeclaration(specifiers, t.stringLiteral(options.source));

  let lastImportIndex = -1;
  for (let i = 0; i < ast.program.body.length; i += 1) {
    if (t.isImportDeclaration(ast.program.body[i])) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    ast.program.body.unshift(decl);
  } else {
    ast.program.body.splice(lastImportIndex + 1, 0, decl);
  }

  const output = generate(ast, {
    retainLines: false,
    compact: false,
    jsescOption: { minimal: true },
  }).code;

  validateSyntax(output);
  return { content: `${output}\n`, changed: true };
}

export function applyAnchorPatch(
  content: string,
  anchor: string,
  insertion: string,
  skipIfContains?: string,
): string {
  const options = skipIfContains === undefined ? {} : { skipIfContains };
  const result = insertAfterAnchor(content, anchor, insertion, options);
  if (result.changed) {
    validateSyntax(result.content);
  }
  return result.content;
}

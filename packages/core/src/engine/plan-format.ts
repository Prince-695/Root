import type { Operation } from "./operations.js";

/** Human-readable plan lines for --dry-run output. */
export function formatOperationPlan(ops: Operation[]): string[] {
  return ops.map((op, i) => {
    const n = `${i + 1}.`;
    switch (op.type) {
      case "createFile":
        return `${n} createFile ${op.path}`;
      case "patchFile":
        return op.kind === "anchor"
          ? `${n} patchFile ${op.path} (anchor ${op.anchor})`
          : `${n} patchFile ${op.path} (import ${op.source})`;
      case "updateSchema":
        return op.kind === "auth"
          ? `${n} updateSchema auth`
          : `${n} updateSchema resource ${op.resourceName}`;
      case "updateManifest":
        return `${n} updateManifest ${op.moduleName} (${op.entry.type})`;
      case "ensureDependency":
        return `${n} ensureDependency ${op.name}@${op.version}${op.dev ? " (dev)" : ""}`;
      case "runCommand":
        return `${n} runCommand ${op.command} ${op.args.join(" ")}`;
      case "updateOrm":
        return `${n} updateOrm ${op.kind} ${op.resourceName}`;
      case "ensureText":
        return `${n} ensureText ${op.path} (${op.transform})`;
      default: {
        const _exhaustive: never = op;
        return `${n} ${JSON.stringify(_exhaustive)}`;
      }
    }
  });
}

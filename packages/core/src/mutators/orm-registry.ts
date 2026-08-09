import type { RootJson } from "../config/root-json.js";
import type { ZodField } from "../engine/operations.js";
import { toCamelCase, toPascalCase } from "../registry/types.js";

const PRISMA_BANNER = "// Models are added by `pnpm dlx root@latest add model|route <name>`";

function createFields(fields: ZodField[]): ZodField[] {
  return fields.filter((f) => !["id", "createdAt", "updatedAt"].includes(f.name));
}

function titleField(fields: ZodField[]): string {
  return (
    createFields(fields).find((f) => f.name === "title")?.name ??
    createFields(fields)[0]?.name ??
    "title"
  );
}

export function appendPrismaModel(
  schemaPrisma: string,
  resourceName: string,
  fields: ZodField[],
): string {
  const pascal = toPascalCase(resourceName);
  if (new RegExp(`\\bmodel\\s+${pascal}\\b`).test(schemaPrisma)) {
    return schemaPrisma;
  }

  const fieldName = titleField(fields);
  const block = `
model ${pascal} {
  id        String   @id @default(cuid())
  ${fieldName.padEnd(9)} String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  if (schemaPrisma.includes(PRISMA_BANNER)) {
    return schemaPrisma.replace(PRISMA_BANNER, `${PRISMA_BANNER}\n${block.trimEnd()}\n`);
  }
  return `${schemaPrisma.trimEnd()}\n${block}`;
}

export function appendDrizzleTable(
  schemaTs: string,
  resourceName: string,
  fields: ZodField[],
  database: RootJson["database"],
): string {
  const camel = toCamelCase(resourceName);
  if (new RegExp(`export const ${camel}\\b`).test(schemaTs)) {
    return schemaTs;
  }

  const fieldName = titleField(fields);
  const tableName = `${camel}`;

  if (database === "mysql") {
    const block = `
export const ${camel} = mysqlTable("${tableName}", {
  id: int("id").primaryKey().autoincrement(),
  ${fieldName}: text("${fieldName}"),
  createdAt: timestamp("created_at").defaultNow(),
});
`;
    let next = schemaTs;
    if (!next.includes('from "drizzle-orm/mysql-core"')) {
      next = `import { int, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";\n${next}`;
    }
    return `${next.trimEnd()}\n${block}`;
  }

  // postgresql default for drizzle in our matrix
  const block = `
export const ${camel} = pgTable("${tableName}", {
  id: serial("id").primaryKey(),
  ${fieldName}: text("${fieldName}"),
  createdAt: timestamp("created_at").defaultNow(),
});
`;
  let next = schemaTs;
  if (!next.includes('from "drizzle-orm/pg-core"')) {
    next = `import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";\n${next}`;
  }
  return `${next.trimEnd()}\n${block}`;
}

export function buildMongooseModelFile(resourceName: string, fields: ZodField[]): string {
  const pascal = toPascalCase(resourceName);
  const fieldName = titleField(fields);
  return `import { Schema, model, type InferSchemaType } from "mongoose";

const ${pascal}Schema = new Schema(
  {
    ${fieldName}: { type: String, required: true },
  },
  { timestamps: true },
);

export type ${pascal}Document = InferSchemaType<typeof ${pascal}Schema>;
export const ${pascal}Model = model("${pascal}", ${pascal}Schema);
`;
}

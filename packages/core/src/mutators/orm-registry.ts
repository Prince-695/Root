import type { RootJson } from "../config/root-json.js";
import { rootInvoke } from "../constants.js";
import type { ZodField } from "../engine/operations.js";
import { toCamelCase, toPascalCase } from "../registry/types.js";

const PRISMA_BANNER = `// Models are added by \`${rootInvoke("add resource <name>")}\``;

function createFields(fields: ZodField[]): ZodField[] {
  return fields.filter((f) => !["id", "createdAt", "updatedAt"].includes(f.name));
}

function prismaLine(field: ZodField): string {
  if (field.ormType) {
    return `  ${field.name.padEnd(9)} ${field.ormType}`;
  }
  if (field.name === "email") {
    return "  email     String   @unique";
  }
  if (field.name === "passwordHash") {
    return "  passwordHash String";
  }
  if (field.name === "authorId") {
    return "  authorId  String";
  }
  return `  ${field.name.padEnd(9)} String`;
}

export function appendPrismaModel(
  schemaPrisma: string,
  resourceName: string,
  fields: ZodField[],
): string {
  const pascal = toPascalCase(resourceName);
  if (new RegExp(`\\bmodel\\s+${pascal}\\b`).test(schemaPrisma)) {
    // Ensure authorId exists when requested (auth retrofit).
    const wantsAuthor = createFields(fields).some((f) => f.name === "authorId");
    if (wantsAuthor && !new RegExp(`model\\s+${pascal}[\\s\\S]*?authorId`).test(schemaPrisma)) {
      return schemaPrisma.replace(
        new RegExp(`(model\\s+${pascal}\\s*\\{[^}]*)(\\n\\})`),
        "$1\n  authorId  String$2",
      );
    }
    return schemaPrisma;
  }

  const body = createFields(fields).map(prismaLine).join("\n");
  const block = `
model ${pascal} {
  id        String   @id @default(cuid())
${body}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  if (schemaPrisma.includes(PRISMA_BANNER)) {
    return schemaPrisma.replace(PRISMA_BANNER, `${PRISMA_BANNER}\n${block.trimEnd()}\n`);
  }
  return `${schemaPrisma.trimEnd()}\n${block}`;
}

function drizzleColumns(fields: ZodField[], database: RootJson["database"]): string {
  const cols = createFields(fields);
  if (database === "mysql") {
    return cols
      .map((f) => {
        if (f.name === "email") return `  email: text("email").notNull().unique(),`;
        if (f.name === "passwordHash") return `  passwordHash: text("password_hash").notNull(),`;
        if (f.name === "authorId") return `  authorId: text("author_id").notNull(),`;
        return `  ${f.name}: text("${f.name}"),`;
      })
      .join("\n");
  }
  return cols
    .map((f) => {
      if (f.name === "email") return `  email: text("email").notNull().unique(),`;
      if (f.name === "passwordHash") return `  passwordHash: text("password_hash").notNull(),`;
      if (f.name === "authorId") return `  authorId: text("author_id").notNull(),`;
      return `  ${f.name}: text("${f.name}"),`;
    })
    .join("\n");
}

export function appendDrizzleTable(
  schemaTs: string,
  resourceName: string,
  fields: ZodField[],
  database: RootJson["database"],
): string {
  const camel = toCamelCase(resourceName);
  // Auth user table is conventionally `users`
  const exportName = resourceName === "user" ? "users" : camel;
  if (new RegExp(`export const ${exportName}\\b`).test(schemaTs)) {
    return schemaTs;
  }

  const tableName = exportName;
  const columns = drizzleColumns(fields, database);

  if (database === "mysql") {
    const block = `
export const ${exportName} = mysqlTable("${tableName}", {
  id: int("id").primaryKey().autoincrement(),
${columns}
  createdAt: timestamp("created_at").defaultNow(),
});
`;
    let next = schemaTs;
    if (!next.includes('from "drizzle-orm/mysql-core"')) {
      next = `import { int, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";\n${next}`;
    }
    return `${next.trimEnd()}\n${block}`;
  }

  if (database === "sqlite") {
    const block = `
export const ${exportName} = sqliteTable("${tableName}", {
  id: integer("id").primaryKey({ autoIncrement: true }),
${columns}
  createdAt: integer("created_at", { mode: "timestamp" }),
});
`;
    let next = schemaTs;
    if (!next.includes('from "drizzle-orm/sqlite-core"')) {
      next = `import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";\n${next}`;
    }
    return `${next.trimEnd()}\n${block}`;
  }

  const block = `
export const ${exportName} = pgTable("${tableName}", {
  id: serial("id").primaryKey(),
${columns}
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
  const body = createFields(fields)
    .map((f) => {
      if (f.name === "email") {
        return "    email: { type: String, required: true, unique: true },";
      }
      if (f.name === "passwordHash") {
        return "    passwordHash: { type: String, required: true },";
      }
      if (f.name === "authorId") {
        return "    authorId: { type: String, required: true },";
      }
      return `    ${f.name}: { type: String, required: true },`;
    })
    .join("\n");

  return `import { Schema, model, type InferSchemaType } from "mongoose";

const ${pascal}Schema = new Schema(
  {
${body}
  },
  { timestamps: true },
);

export type ${pascal}Document = InferSchemaType<typeof ${pascal}Schema>;
export const ${pascal}Model = model("${pascal}", ${pascal}Schema);
`;
}

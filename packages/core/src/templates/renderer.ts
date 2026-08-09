import { readFile } from "node:fs/promises";
import Handlebars from "handlebars";

export type TemplateContext = Record<string, unknown>;

export async function renderTemplateFile(
  absolutePath: string,
  context: TemplateContext,
): Promise<string> {
  const source = await readFile(absolutePath, "utf8");
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}

export function renderTemplateString(source: string, context: TemplateContext): string {
  return Handlebars.compile(source, { noEscape: true })(context);
}

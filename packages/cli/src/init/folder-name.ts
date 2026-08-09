/** Valid project folder names: lowercase, digits, hyphens (shadcn-style). */
export const FOLDER_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidFolderName(name: string): boolean {
  return FOLDER_NAME_PATTERN.test(name);
}

export function defaultFolderPlaceholder(cwd: string): string {
  return cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? "my-api";
}

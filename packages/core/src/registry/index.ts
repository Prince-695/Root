import { authRecipe } from "./recipes/auth.js";
import { controllerRecipe } from "./recipes/controller.js";
import { middlewareRecipe } from "./recipes/middleware.js";
import { modelRecipe } from "./recipes/model.js";
import { resourceRecipe } from "./recipes/resource.js";
import { schemaRecipe } from "./recipes/schema.js";
import { serviceRecipe } from "./recipes/service.js";
import { validateRecipe } from "./recipes/validate.js";
import type { Recipe, RecipeId } from "./types.js";

export type { Recipe, RecipeContext, RecipeId } from "./types.js";
export { schemaExportName, toCamelCase, toPascalCase } from "./types.js";

const RECIPES: Record<RecipeId, Recipe> = {
  schema: schemaRecipe,
  validate: validateRecipe,
  resource: resourceRecipe,
  auth: authRecipe,
  model: modelRecipe,
  service: serviceRecipe,
  middleware: middlewareRecipe,
  controller: controllerRecipe,
};

export function getRecipe(id: RecipeId): Recipe {
  const recipe = RECIPES[id];
  if (!recipe) {
    throw new Error(`Unknown recipe: ${id}`);
  }
  return recipe;
}

export function listRecipeIds(): RecipeId[] {
  return Object.keys(RECIPES) as RecipeId[];
}

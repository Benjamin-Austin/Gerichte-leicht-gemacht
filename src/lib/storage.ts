import { GROCERY_CATEGORIES, MEAL_TYPES, RECIPE_CATEGORIES, type GroceryCategory, type MealType, type Recipe, type ShoppingItem, type WeeklyPlan } from '../types'
import { inferShoppingCategory, normalizeIngredientName } from './ingredients'

const keys = {
  recipes: 'sonntagskueche:recipes:v1',
  plan: 'sonntagskueche:plan:v1',
  shopping: 'sonntagskueche:shopping:v1',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private browsing; the app remains usable in memory.
  }
}

const categoryMigration: Record<string, (typeof RECIPE_CATEGORIES)[number]> = {
  Familienliebling: 'Fleisch',
  Würzig: 'Fleisch',
  Schnell: 'Sonstiges',
  Pasta: 'Sonstiges',
  Frisch: 'Vegetarisch',
  Wochenende: 'Sonstiges',
  'One-Pot': 'Fleisch',
}

function normalizeRecipe(recipe: Recipe): Recipe {
  const category = RECIPE_CATEGORIES.includes(recipe.category as (typeof RECIPE_CATEGORIES)[number])
    ? recipe.category
    : categoryMigration[recipe.category] ?? 'Sonstiges'
  return {
    ...recipe,
    category,
    servings: Number.isFinite(recipe.servings) && (recipe.servings ?? 0) >= 1 ? recipe.servings : 4,
    preparation: Array.isArray(recipe.preparation) ? recipe.preparation.filter(Boolean) : undefined,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter((ingredient) => ingredient?.name).map((ingredient) => ({
      ...ingredient,
      normalizedName: normalizeIngredientName(ingredient.name),
      category: normalizeGroceryCategory(ingredient.category, ingredient.name),
    })) : [],
  }
}

const groceryMigration: Record<string, GroceryCategory> = {
  'Gemüse & Obst': 'Gemüse & Früchte',
  'Milchprodukte & Eier': 'Milchprodukte & Käse',
  'Konserven & Eingelegtes': 'Trockenvorräte',
}

function normalizeGroceryCategory(category: string | undefined, name: string): GroceryCategory {
  if (category && GROCERY_CATEGORIES.includes(category as GroceryCategory)) return category as GroceryCategory
  return groceryMigration[category ?? ''] ?? inferShoppingCategory(name)
}

function normalizePlan(plan: WeeklyPlan): WeeklyPlan {
  if (Array.isArray(plan.mealSlots)) {
    return {
      mealSlots: plan.mealSlots.filter((slot) => slot && (typeof slot.recipeId === 'string' || slot.ingredient?.name)).map((slot) => ({
        ...slot,
        id: slot.id || `${slot.recipeId}-${slot.mealType}`,
        mealType: MEAL_TYPES.includes(slot.mealType) ? slot.mealType : 'Mittagessen',
        servings: Number.isFinite(slot.servings) && slot.servings >= 1 ? slot.servings : 1,
        ingredient: slot.ingredient ? {
          ...slot.ingredient,
          category: normalizeGroceryCategory(slot.ingredient.category, slot.ingredient.name),
          normalizedName: normalizeIngredientName(slot.ingredient.name),
          quantity: Number.isFinite(slot.ingredient.quantity) && slot.ingredient.quantity > 0 ? slot.ingredient.quantity : 1,
          unit: slot.ingredient.unit || 'Stück',
        } : undefined,
      })),
    }
  }
  const legacyIds = Array.isArray(plan.selectedRecipeIds) ? plan.selectedRecipeIds : []
  return {
    mealSlots: legacyIds.map((recipeId, index) => ({ id: `legacy-${recipeId}-${index}`, recipeId, mealType: 'Mittagessen' as MealType, servings: 1 })),
  }
}

export const storage = {
  loadRecipes: (fallback: Recipe[]) => read(keys.recipes, fallback).map(normalizeRecipe),
  saveRecipes: (recipes: Recipe[]) => write(keys.recipes, recipes),
  loadPlan: (fallback: WeeklyPlan) => normalizePlan(read(keys.plan, fallback)),
  savePlan: (plan: WeeklyPlan) => write(keys.plan, plan),
  loadShopping: (fallback: ShoppingItem[]) => read(keys.shopping, fallback),
  saveShopping: (items: ShoppingItem[]) => write(keys.shopping, items),
}

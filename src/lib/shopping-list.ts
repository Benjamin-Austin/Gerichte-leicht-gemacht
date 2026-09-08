import type { PlannedRecipe, Recipe, ShoppingItem } from '../types'
import { mergeIngredients, roundShoppingQuantity } from './ingredients'

export type PlannedRecipeInput = PlannedRecipe | { recipeId: string, servings: number }

export function generateShoppingList(recipes: Recipe[], plannedRecipes: PlannedRecipeInput[] | string[], checkedIds: string[] = []): ShoppingItem[] {
  const selectedRecipes = plannedRecipes.flatMap((planned, index) => {
    if (typeof planned !== 'string' && 'ingredient' in planned && planned.ingredient) {
      return [{ ...planned.ingredient, id: `${planned.ingredient.id}-${index}` }]
    }
    const recipeId = typeof planned === 'string' ? planned : planned.recipeId
    if (!recipeId) return []
    const recipe = recipes.find((item) => item.id === recipeId)
    if (!recipe) return []
    const servings = typeof planned === 'string' ? recipe.servings ?? 4 : Math.max(1, planned.servings)
    const factor = servings / (recipe.servings ?? 4)
    return recipe.ingredients.map((ingredient) => ({ ...ingredient, quantity: roundShoppingQuantity(ingredient.quantity * factor, ingredient.unit), id: `${ingredient.id}-${index}` }))
  })
  const items = mergeIngredients(selectedRecipes)
  const checked = new Set(checkedIds)
  return items.map((item) => ({ ...item, checked: checked.has(item.id) }))
}

export function groupByCategory(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  return items.reduce<Record<string, ShoppingItem[]>>((groups, item) => {
    groups[item.category] ??= []
    groups[item.category].push(item)
    return groups
  }, {})
}

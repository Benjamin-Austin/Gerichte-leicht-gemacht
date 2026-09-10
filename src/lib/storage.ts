import { GROCERY_CATEGORIES, MEAL_TYPES, RECIPE_CATEGORIES, type GroceryCategory, type MealType, type Recipe, type ShoppingItem, type WeeklyPlan } from '../types'
import { inferShoppingCategory, normalizeIngredientName } from './ingredients'
import { supabase } from './supabase'

type DbRecipe = {
  id: string
  name: string
  category: string
  servings: number | null
  image_path: string | null
  preparation: string | null
  video_url: string | null
  preparation_time: string | null
  difficulty: string | null
  notes: string | null
  ingredients?: Array<{ id: string; name: string; normalized_name: string; quantity: number; unit: string; category: string }>
  preparation_images?: Array<{ id: string; storage_path: string; step: number | null }>
}

type DbPlanSlot = {
  id: string
  recipe_id: string | null
  meal_type: string
  servings: number | null
  ingredient_name: string | null
  ingredient_quantity: number | null
  ingredient_unit: string | null
  ingredient_category: string | null
}

type DbShoppingItem = { ingredient_ref: string; checked: boolean | null; hidden: boolean | null }

const categoryMigration: Record<string, (typeof RECIPE_CATEGORIES)[number]> = {
  Familienliebling: 'Fleisch', Würzig: 'Fleisch', Schnell: 'Sonstiges', Pasta: 'Sonstiges',
  Frisch: 'Vegetarisch', Wochenende: 'Sonstiges', 'One-Pot': 'Fleisch',
}
const groceryMigration: Record<string, GroceryCategory> = {
  'Gemüse & Obst': 'Gemüse & Früchte', 'Milchprodukte & Eier': 'Milchprodukte & Käse', 'Konserven & Eingelegtes': 'Trockenvorräte',
}

function databaseId(value: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : crypto.randomUUID()
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Bitte melde dich an, um deine Daten zu laden.')
  return data.user.id
}

function normalizeGroceryCategory(category: string | undefined, name: string): GroceryCategory {
  if (category && GROCERY_CATEGORIES.includes(category as GroceryCategory)) return category as GroceryCategory
  return groceryMigration[category ?? ''] ?? inferShoppingCategory(name)
}

function normalizeRecipe(recipe: Recipe): Recipe {
  const category = RECIPE_CATEGORIES.includes(recipe.category as (typeof RECIPE_CATEGORIES)[number]) ? recipe.category : categoryMigration[recipe.category] ?? 'Sonstiges'
  return {
    ...recipe,
    category,
    servings: Number.isFinite(recipe.servings) && (recipe.servings ?? 0) >= 1 ? recipe.servings : 4,
    preparation: Array.isArray(recipe.preparation) ? recipe.preparation.filter(Boolean).join('\n') : typeof recipe.preparation === 'string' ? recipe.preparation : undefined,
    preparationImages: Array.isArray(recipe.preparationImages) ? recipe.preparationImages.filter((image) => image?.storagePath).map((image, index) => ({
      id: image.id || `preparation-image-${index}`, storagePath: image.storagePath, imageUrl: image.imageUrl,
      step: Number.isFinite(image.step) && image.step >= 0 ? Math.floor(image.step) : 0,
    })) : undefined,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter((ingredient) => ingredient?.name).map((ingredient) => ({
      ...ingredient, normalizedName: normalizeIngredientName(ingredient.name), category: normalizeGroceryCategory(ingredient.category, ingredient.name),
    })) : [],
  }
}

function normalizePlan(plan: WeeklyPlan): WeeklyPlan {
  if (Array.isArray(plan.mealSlots)) return {
    mealSlots: plan.mealSlots.filter((slot) => slot && (typeof slot.recipeId === 'string' || slot.ingredient?.name)).map((slot) => ({
      ...slot,
      id: slot.id || `${slot.recipeId ?? 'ingredient'}-${slot.mealType}`,
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
  const legacyIds = Array.isArray(plan.selectedRecipeIds) ? plan.selectedRecipeIds : []
  return { mealSlots: legacyIds.map((recipeId, index) => ({ id: `legacy-${recipeId}-${index}`, recipeId, mealType: 'Mittagessen' as MealType, servings: 1 })) }
}

async function signUrl(bucket: string, path: string | null | undefined): Promise<string | undefined> {
  if (!path) return undefined
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

async function mapRecipe(row: DbRecipe): Promise<Recipe> {
  const imageUrl = await signUrl('recipe-covers', row.image_path)
  const preparationImages = await Promise.all((row.preparation_images ?? []).map(async (image) => ({
    id: image.id, storagePath: image.storage_path, imageUrl: await signUrl('preparation-images', image.storage_path), step: image.step ?? 0,
  })))
  return normalizeRecipe({
    id: row.id, name: row.name, category: row.category, servings: row.servings ?? 4,
    imagePath: row.image_path ?? undefined, imageUrl, preparation: row.preparation ?? undefined, preparationImages,
    videoUrl: row.video_url ?? undefined, preparationTime: row.preparation_time ?? undefined,
    difficulty: row.difficulty ?? undefined, notes: row.notes ?? undefined,
    ingredients: (row.ingredients ?? []).map((ingredient) => ({
      id: ingredient.id, name: ingredient.name, normalizedName: ingredient.normalized_name,
      quantity: Number(ingredient.quantity), unit: ingredient.unit, category: normalizeGroceryCategory(ingredient.category, ingredient.name),
    })),
  })
}

async function loadRecipes(fallback: Recipe[]): Promise<Recipe[]> {
  await requireUserId()
  const { data, error } = await supabase.from('recipes').select('*, ingredients(*), preparation_images(*)').order('created_at', { ascending: true })
  if (error) throw error
  if (!data?.length) return fallback.map(normalizeRecipe)
  return Promise.all((data as DbRecipe[]).map(mapRecipe))
}

async function saveRecipesNow(recipes: Recipe[]): Promise<void> {
  const userId = await requireUserId()
  const normalizedRecipes: Recipe[] = recipes.map(normalizeRecipe)
  const { data: existing, error: existingError } = await supabase.from('recipes').select('id').eq('user_id', userId)
  if (existingError) throw existingError
  const ids = new Set(normalizedRecipes.map((recipe) => recipe.id))
  const removedIds = ((existing ?? []) as Array<{ id: string }>).map((row) => row.id).filter((id) => !ids.has(id))
  if (removedIds.length) {
    const { error } = await supabase.from('recipes').delete().eq('user_id', userId).in('id', removedIds)
    if (error) throw error
  }
  if (!normalizedRecipes.length) return
  const { error: recipeError } = await supabase.from('recipes').upsert(normalizedRecipes.map((recipe) => ({
    id: recipe.id, user_id: userId, name: recipe.name, category: recipe.category, servings: recipe.servings ?? 4,
    image_path: recipe.imagePath ?? null, preparation: recipe.preparation ?? null, video_url: recipe.videoUrl ?? null,
    preparation_time: recipe.preparationTime ?? null, difficulty: recipe.difficulty ?? null, notes: recipe.notes ?? null,
  })))
  if (recipeError) throw recipeError
  for (const recipe of normalizedRecipes) {
    const { error: ingredientDeleteError } = await supabase.from('ingredients').delete().eq('recipe_id', recipe.id)
    if (ingredientDeleteError) throw ingredientDeleteError
    if (recipe.ingredients.length) {
      const { error } = await supabase.from('ingredients').upsert(recipe.ingredients.map((ingredient) => ({
        id: databaseId(ingredient.id), recipe_id: recipe.id, name: ingredient.name, normalized_name: normalizeIngredientName(ingredient.name),
        quantity: ingredient.quantity, unit: ingredient.unit, category: ingredient.category,
      })))
      if (error) throw error
    }
    const { error: imageDeleteError } = await supabase.from('preparation_images').delete().eq('recipe_id', recipe.id)
    if (imageDeleteError) throw imageDeleteError
    if (recipe.preparationImages?.length) {
      const { error } = await supabase.from('preparation_images').upsert(recipe.preparationImages.map((image) => ({
        id: image.id, recipe_id: recipe.id, storage_path: image.storagePath, step: image.step,
      })))
      if (error) throw error
    }
  }
}

let recipesSaveQueue = Promise.resolve()

function saveRecipes(recipes: Recipe[]): Promise<void> {
  const save = recipesSaveQueue.then(() => saveRecipesNow(recipes))
  recipesSaveQueue = save.catch(() => undefined)
  return save
}

async function loadPlan(fallback: WeeklyPlan): Promise<WeeklyPlan> {
  const userId = await requireUserId()
  const { data, error } = await supabase.from('plan_slots').select('*').eq('user_id', userId).order('id')
  if (error) throw error
  if (!data?.length) return normalizePlan(fallback)
  return normalizePlan({ mealSlots: (data as DbPlanSlot[]).map((slot) => ({
    id: slot.id, recipeId: slot.recipe_id ?? undefined, mealType: slot.meal_type as MealType, servings: slot.servings ?? 1,
    ingredient: slot.ingredient_name ? {
      id: `planned-${slot.id}`, name: slot.ingredient_name, normalizedName: normalizeIngredientName(slot.ingredient_name),
      quantity: Number(slot.ingredient_quantity ?? 1), unit: slot.ingredient_unit ?? 'Stück',
      category: normalizeGroceryCategory(slot.ingredient_category ?? undefined, slot.ingredient_name),
    } : undefined,
  })) })
}

async function savePlanNow(plan: WeeklyPlan): Promise<void> {
  const userId = await requireUserId()
  const normalizedPlan = normalizePlan(plan)
  const { error: deleteError } = await supabase.from('plan_slots').delete().eq('user_id', userId)
  if (deleteError) throw deleteError
  if (!normalizedPlan.mealSlots.length) return
  const { error } = await supabase.from('plan_slots').insert(normalizedPlan.mealSlots.map((slot) => ({
    id: slot.id, user_id: userId, recipe_id: slot.recipeId ?? null, meal_type: slot.mealType, servings: slot.servings,
    ingredient_name: slot.ingredient?.name ?? null, ingredient_quantity: slot.ingredient?.quantity ?? null,
    ingredient_unit: slot.ingredient?.unit ?? null, ingredient_category: slot.ingredient?.category ?? null,
  })))
  if (error) throw error
}

let planSaveQueue = Promise.resolve()

function savePlan(plan: WeeklyPlan): Promise<void> {
  const save = planSaveQueue.then(() => savePlanNow(plan))
  planSaveQueue = save.catch(() => undefined)
  return save
}

async function loadShopping(fallback: ShoppingItem[]): Promise<ShoppingItem[]> {
  const userId = await requireUserId()
  const { data, error } = await supabase.from('shopping_items').select('ingredient_ref, checked, hidden').eq('user_id', userId)
  if (error) throw error
  if (!data?.length) return fallback
  return (data as DbShoppingItem[]).map((item) => ({ id: item.ingredient_ref, name: item.ingredient_ref, quantity: 0, unit: '', category: 'Sonstiges', checked: Boolean(item.checked), hidden: Boolean(item.hidden) }))
}

async function saveShopping(items: ShoppingItem[]): Promise<void> {
  const userId = await requireUserId()
  const { error: deleteError } = await supabase.from('shopping_items').delete().eq('user_id', userId)
  if (deleteError) throw deleteError
  if (!items.length) return
  const { error } = await supabase.from('shopping_items').insert(items.map((item) => ({ user_id: userId, ingredient_ref: item.id, checked: item.checked, hidden: Boolean(item.hidden) })))
  if (error) throw error
}

export const storage = { loadRecipes, saveRecipes, loadPlan, savePlan, loadShopping, saveShopping }

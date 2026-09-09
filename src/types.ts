export const GROCERY_CATEGORIES = [
  'Gemüse & Früchte',
  'Backwaren',
  'Milchprodukte & Käse',
  'Fleisch & Fisch',
  'Tiefkühlprodukte',
  'Saucen & Gewürze',
  'Snacks',
  'Trockenvorräte',
  'Getränke',
  'Non-Food',
  'Sonstiges',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

export const RECIPE_CATEGORIES = ['Vegetarisch', 'Fleisch', 'Vegan', 'Fisch', 'Sonstiges'] as const
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]

export const UNITS = ['g', 'kg', 'ml', 'l', 'TL', 'EL', 'Stück', 'Packung', 'Dose', 'Prise', 'Bund'] as const
export type Unit = (typeof UNITS)[number]

export const MEAL_TYPES = ['Frühstück', 'Mittagessen', 'Nachtessen', 'Snacks', 'Sonstiges'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export type Ingredient = {
  id: string
  name: string
  normalizedName: string
  quantity: number
  unit: string
  category: GroceryCategory
}

export type CatalogItem = {
  id: string
  name: string
  aliases?: string[]
  shoppingCategory: GroceryCategory
  type: 'food' | 'non-food'
  defaultUnit?: string
}

export type PreparationImage = {
  id: string
  storagePath: string
  imageUrl?: string
  step: number
}

export type Recipe = {
  id: string
  name: string
  category: string
  servings?: number
  imagePath?: string
  imageUrl?: string
  preparation?: string
  preparationImages?: PreparationImage[]
  videoUrl?: string
  preparationTime?: string
  difficulty?: string
  notes?: string
  ingredients: Ingredient[]
}

export type PlannedRecipe = {
  id: string
  recipeId?: string
  mealType: MealType
  servings: number
  ingredient?: Ingredient
}

export type WeeklyPlan = {
  mealSlots: PlannedRecipe[]
  weekStart?: string
  selectedRecipeIds?: string[]
}

export type ShoppingItem = {
  id: string
  name: string
  quantity: number
  unit: string
  category: GroceryCategory
  checked: boolean
  hidden?: boolean
}

export type Tab = 'planner' | 'recipes' | 'shopping'

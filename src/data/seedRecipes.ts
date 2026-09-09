import type { GroceryCategory, Ingredient, Recipe } from '../types'
import { normalizeIngredientName } from '../lib/ingredients'

let ingredientCounter = 0
const ingredient = (name: string, quantity: number, unit: string, category: GroceryCategory): Ingredient => ({
  id: `seed-${ingredientCounter++}`,
  name,
  normalizedName: normalizeIngredientName(name),
  quantity,
  unit,
  category,
})

export const seedRecipes: Recipe[] = [
  { id: 'spaghetti-bolognese', name: 'Spaghetti Bolognese', category: 'Fleisch', ingredients: [ingredient('Spaghetti', 500, 'g', 'Trockenvorräte'), ingredient('Hackfleisch', 400, 'g', 'Fleisch & Fisch'), ingredient('Tomaten', 4, 'Stk.', 'Gemüse & Früchte'), ingredient('Zwiebel', 1, 'Stk.', 'Gemüse & Früchte'), ingredient('Passierte Tomaten', 500, 'ml', 'Trockenvorräte')] },
  { id: 'chicken-curry', name: 'Chicken Curry', category: 'Fleisch', ingredients: [ingredient('Hähnchenbrust', 500, 'g', 'Fleisch & Fisch'), ingredient('Reis', 300, 'g', 'Trockenvorräte'), ingredient('Kokosmilch', 400, 'ml', 'Trockenvorräte'), ingredient('Paprika', 2, 'Stk.', 'Gemüse & Früchte'), ingredient('Currypulver', 2, 'TL', 'Saucen & Gewürze')] },
  { id: 'chicken-teriyaki', name: 'Chicken Teriyaki', category: 'Fleisch', ingredients: [ingredient('Hähnchenbrust', 300, 'g', 'Fleisch & Fisch'), ingredient('Reis', 250, 'g', 'Trockenvorräte'), ingredient('Brokkoli', 1, 'Stk.', 'Gemüse & Früchte'), ingredient('Teriyakisauce', 100, 'ml', 'Saucen & Gewürze')] },
  { id: 'tacos', name: 'Tacos', category: 'Fleisch', ingredients: [ingredient('Hackfleisch', 400, 'g', 'Fleisch & Fisch'), ingredient('Tortillas', 8, 'Stk.', 'Backwaren'), ingredient('Tomate', 2, 'Stk.', 'Gemüse & Früchte'), ingredient('Avocado', 2, 'Stk.', 'Gemüse & Früchte'), ingredient('Cheddar', 150, 'g', 'Milchprodukte & Käse')] },
  { id: 'gemuesepfanne', name: 'Bunte Gemüsepfanne', category: 'Vegetarisch', ingredients: [ingredient('Zucchini', 2, 'Stk.', 'Gemüse & Früchte'), ingredient('Paprika', 2, 'Stk.', 'Gemüse & Früchte'), ingredient('Champignons', 250, 'g', 'Gemüse & Früchte'), ingredient('Reis', 200, 'g', 'Trockenvorräte')] },
  { id: 'pasta-carbonara', name: 'Pasta Carbonara', category: 'Fleisch', ingredients: [ingredient('Pasta', 400, 'g', 'Trockenvorräte'), ingredient('Eier', 3, 'Stk.', 'Milchprodukte & Käse'), ingredient('Parmesan', 100, 'g', 'Milchprodukte & Käse'), ingredient('Speck', 150, 'g', 'Fleisch & Fisch')] },
  { id: 'griechischer-salat', name: 'Griechischer Salat', category: 'Vegetarisch', ingredients: [ingredient('Gurke', 1, 'Stk.', 'Gemüse & Früchte'), ingredient('Tomaten', 4, 'Stk.', 'Gemüse & Früchte'), ingredient('Feta', 200, 'g', 'Milchprodukte & Käse'), ingredient('Oliven', 100, 'g', 'Gemüse & Früchte')] },
  { id: 'pizza', name: 'Hausgemachte Pizza', category: 'Vegetarisch', ingredients: [ingredient('Mehl', 500, 'g', 'Trockenvorräte'), ingredient('Hefe', 1, 'Pck.', 'Backwaren'), ingredient('Mozzarella', 250, 'g', 'Milchprodukte & Käse'), ingredient('Passierte Tomaten', 200, 'ml', 'Trockenvorräte')] },
  { id: 'chili', name: 'Chili con Carne', category: 'Fleisch', ingredients: [ingredient('Hackfleisch', 500, 'g', 'Fleisch & Fisch'), ingredient('Kidneybohnen', 2, 'Dosen', 'Trockenvorräte'), ingredient('Mais', 1, 'Dose', 'Trockenvorräte'), ingredient('Tomaten', 2, 'Stk.', 'Gemüse & Früchte')] },
  { id: 'fried-rice', name: 'Gebratener Reis', category: 'Vegetarisch', ingredients: [ingredient('Reis', 300, 'g', 'Trockenvorräte'), ingredient('Eier', 2, 'Stk.', 'Milchprodukte & Käse'), ingredient('Erbsen', 150, 'g', 'Tiefkühlprodukte'), ingredient('Sojasauce', 50, 'ml', 'Saucen & Gewürze')] },
  { id: 'chicken-wraps', name: 'Chicken Wraps', category: 'Fleisch', ingredients: [ingredient('Hähnchenbrust', 200, 'g', 'Fleisch & Fisch'), ingredient('Wraps', 4, 'Stk.', 'Backwaren'), ingredient('Salat', 1, 'Stk.', 'Gemüse & Früchte'), ingredient('Joghurt', 150, 'g', 'Milchprodukte & Käse')] },
]

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
  { id: 'spaghetti-bolognese', name: 'Spaghetti Bolognese', category: 'Familienliebling', ingredients: [ingredient('Spaghetti', 500, 'g', 'Trockenvorräte'), ingredient('Hackfleisch', 400, 'g', 'Fleisch & Fisch'), ingredient('Tomaten', 4, 'Stk.', 'Gemüse & Obst'), ingredient('Zwiebel', 1, 'Stk.', 'Gemüse & Obst'), ingredient('Passierte Tomaten', 500, 'ml', 'Konserven & Eingelegtes')] },
  { id: 'chicken-curry', name: 'Chicken Curry', category: 'Würzig', ingredients: [ingredient('Hähnchenbrust', 500, 'g', 'Fleisch & Fisch'), ingredient('Reis', 300, 'g', 'Trockenvorräte'), ingredient('Kokosmilch', 400, 'ml', 'Konserven & Eingelegtes'), ingredient('Paprika', 2, 'Stk.', 'Gemüse & Obst'), ingredient('Currypulver', 2, 'TL', 'Saucen & Gewürze')] },
  { id: 'chicken-teriyaki', name: 'Chicken Teriyaki', category: 'Schnell', ingredients: [ingredient('Hähnchenbrust', 300, 'g', 'Fleisch & Fisch'), ingredient('Reis', 250, 'g', 'Trockenvorräte'), ingredient('Brokkoli', 1, 'Stk.', 'Gemüse & Obst'), ingredient('Teriyakisauce', 100, 'ml', 'Saucen & Gewürze')] },
  { id: 'tacos', name: 'Tacos', category: 'Gesellig', ingredients: [ingredient('Hackfleisch', 400, 'g', 'Fleisch & Fisch'), ingredient('Tortillas', 8, 'Stk.', 'Backwaren'), ingredient('Tomate', 2, 'Stk.', 'Gemüse & Obst'), ingredient('Avocado', 2, 'Stk.', 'Gemüse & Obst'), ingredient('Cheddar', 150, 'g', 'Milchprodukte & Eier')] },
  { id: 'gemuesepfanne', name: 'Bunte Gemüsepfanne', category: 'Vegetarisch', ingredients: [ingredient('Zucchini', 2, 'Stk.', 'Gemüse & Obst'), ingredient('Paprika', 2, 'Stk.', 'Gemüse & Obst'), ingredient('Champignons', 250, 'g', 'Gemüse & Obst'), ingredient('Reis', 200, 'g', 'Trockenvorräte')] },
  { id: 'pasta-carbonara', name: 'Pasta Carbonara', category: 'Pasta', ingredients: [ingredient('Pasta', 400, 'g', 'Trockenvorräte'), ingredient('Eier', 3, 'Stk.', 'Milchprodukte & Eier'), ingredient('Parmesan', 100, 'g', 'Milchprodukte & Eier'), ingredient('Speck', 150, 'g', 'Fleisch & Fisch')] },
  { id: 'griechischer-salat', name: 'Griechischer Salat', category: 'Frisch', ingredients: [ingredient('Gurke', 1, 'Stk.', 'Gemüse & Obst'), ingredient('Tomaten', 4, 'Stk.', 'Gemüse & Obst'), ingredient('Feta', 200, 'g', 'Milchprodukte & Eier'), ingredient('Oliven', 100, 'g', 'Konserven & Eingelegtes')] },
  { id: 'pizza', name: 'Hausgemachte Pizza', category: 'Wochenende', ingredients: [ingredient('Mehl', 500, 'g', 'Trockenvorräte'), ingredient('Hefe', 1, 'Pck.', 'Backwaren'), ingredient('Mozzarella', 250, 'g', 'Milchprodukte & Eier'), ingredient('Passierte Tomaten', 200, 'ml', 'Konserven & Eingelegtes')] },
  { id: 'chili', name: 'Chili con Carne', category: 'One-Pot', ingredients: [ingredient('Hackfleisch', 500, 'g', 'Fleisch & Fisch'), ingredient('Kidneybohnen', 2, 'Dosen', 'Konserven & Eingelegtes'), ingredient('Mais', 1, 'Dose', 'Konserven & Eingelegtes'), ingredient('Tomaten', 2, 'Stk.', 'Gemüse & Obst')] },
  { id: 'fried-rice', name: 'Gebratener Reis', category: 'Schnell', ingredients: [ingredient('Reis', 300, 'g', 'Trockenvorräte'), ingredient('Eier', 2, 'Stk.', 'Milchprodukte & Eier'), ingredient('Erbsen', 150, 'g', 'Tiefkühlprodukte'), ingredient('Sojasauce', 50, 'ml', 'Saucen & Gewürze')] },
  { id: 'chicken-wraps', name: 'Chicken Wraps', category: 'Schnell', ingredients: [ingredient('Hähnchenbrust', 200, 'g', 'Fleisch & Fisch'), ingredient('Wraps', 4, 'Stk.', 'Backwaren'), ingredient('Salat', 1, 'Stk.', 'Gemüse & Obst'), ingredient('Joghurt', 150, 'g', 'Milchprodukte & Eier')] },
]

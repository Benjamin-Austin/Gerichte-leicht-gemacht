import { describe, expect, it } from 'vitest'
import { formatQuantity, inferShoppingCategory, mergeIngredients, normalizeIngredientName, roundShoppingQuantity, searchCatalog } from './ingredients'
import { generateShoppingList, groupByCategory } from './shopping-list'
import type { Recipe } from '../types'
import type { Ingredient } from '../types'

const ingredient = (name: string, quantity: number, unit = 'g'): Ingredient => ({
  id: name + quantity + unit,
  name,
  normalizedName: normalizeIngredientName(name),
  quantity,
  unit,
  category: 'Sonstiges',
})

describe('ingredient logic', () => {
  it('normalizes common German plurals', () => {
    expect(normalizeIngredientName(' Äpfel ')).toBe('apfel')
    expect(normalizeIngredientName('Zwiebeln')).toBe('zwiebel')
  })

  it('merges matching names and units', () => {
    expect(mergeIngredients([ingredient('Hähnchenbrust', 500), ingredient('Hähnchenbrust', 300)])).toEqual([
      expect.objectContaining({ quantity: 800, unit: 'g' }),
    ])
  })

  it('keeps different units separate', () => {
    expect(mergeIngredients([ingredient('Apfel', 1, 'Stk.'), ingredient('Äpfel', 1, 'kg')])).toHaveLength(2)
  })

  it('formats grams as kilograms at 1000 grams', () => {
    expect(formatQuantity(1000, 'g')).toBe('1 kg')
  })

  it('rounds grams to practical 25 gram steps', () => {
    expect(roundShoppingQuantity(213.5, 'g')).toBe(225)
    expect(roundShoppingQuantity(237, 'g')).toBe(225)
    expect(roundShoppingQuantity(263, 'g')).toBe(275)
  })

  it('scales shopping quantities from planned servings', () => {
    const recipe: Recipe = { id: 'pasta', name: 'Pasta', category: 'Vegetarisch', servings: 4, ingredients: [ingredient('Pasta', 400)] }
    expect(generateShoppingList([recipe], [{ recipeId: 'pasta', servings: 2 }])).toEqual([
      expect.objectContaining({ name: 'Pasta', quantity: 200, unit: 'g' }),
    ])
  })

  it('adds directly planned food to the shopping list', () => {
    const banana = ingredient('Banane', 1, 'Stück')
    expect(generateShoppingList([], [{ id: 'food-1', mealType: 'Frühstück', servings: 1, ingredient: banana }])).toEqual([
      expect.objectContaining({ name: 'Banane', quantity: 1, unit: 'Stück' }),
    ])
  })

  it('merges directly planned food with recipe ingredients', () => {
    const recipe: Recipe = { id: 'breakfast', name: 'Frühstück', category: 'Vegan', servings: 1, ingredients: [ingredient('Bananen', 1, 'Stück')] }
    const banana = ingredient('Banane', 1, 'Stück')
    expect(generateShoppingList([recipe], [
      { recipeId: 'breakfast', servings: 1 },
      { id: 'food-1', mealType: 'Frühstück', servings: 1, ingredient: banana },
    ])).toEqual([expect.objectContaining({ name: 'Bananen', quantity: 2, unit: 'Stück' })])
  })

  it('does not return the catalog before a search starts', () => {
    expect(searchCatalog('')).toEqual([])
    expect(searchCatalog('soja').map((item) => item.name)).toContain('Sojasauce')
    expect(searchCatalog('schoko').map((item) => item.name)).toContain('Schokolade')
  })

  it('infers food and non-food shopping categories centrally', () => {
    expect(inferShoppingCategory('Spaghetti')).toBe('Trockenvorräte')
    expect(inferShoppingCategory('Waschmittel')).toBe('Non-Food')
    expect(inferShoppingCategory('unbekannter Artikel')).toBe('Sonstiges')
  })

  it('keeps grocery groups in the fixed shopping order', () => {
    const groups = groupByCategory([
      { id: 'a', name: 'Wasser', quantity: 1, unit: 'l', category: 'Getränke', checked: false },
      { id: 'b', name: 'Banane', quantity: 1, unit: 'Stück', category: 'Gemüse & Früchte', checked: false },
    ])
    expect(Object.keys(groups)).toEqual(['Gemüse & Früchte', 'Getränke'])
  })
})

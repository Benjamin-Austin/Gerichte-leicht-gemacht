import type { Ingredient, ShoppingItem } from '../types'

const pluralAliases: Record<string, string> = {
  äpfel: 'apfel',
  bananen: 'banane',
  zwiebeln: 'zwiebel',
  tomaten: 'tomate',
  kartoffeln: 'kartoffel',
  knoblauchzehen: 'knoblauchzehe',
  eier: 'ei',
  wraps: 'wrap',
}

export function normalizeIngredientName(name: string): string {
  const normalized = name.trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' ')
  return pluralAliases[normalized] ?? normalized.replace(/s$/, '')
}

export function formatQuantity(quantity: number, unit: string): string {
  if (unit === 'g' && quantity >= 1000) {
    const kilograms = quantity / 1000
    return `${Number.isInteger(kilograms) ? kilograms : kilograms.toFixed(1)} kg`
  }
  return `${Number.isInteger(quantity) ? quantity : quantity.toFixed(1)} ${unit}`.trim()
}

export function roundShoppingQuantity(quantity: number, unit: string): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0
  if (unit === 'g') return Math.round(quantity / 25) * 25
  if (unit === 'kg' || unit === 'l' || unit === 'ml' || unit === 'Stück' || unit === 'Packung' || unit === 'Dose' || unit === 'Bund') return Math.max(1, Math.round(quantity))
  return Math.round(quantity * 10) / 10
}

export function mergeIngredients(ingredients: Ingredient[]): ShoppingItem[] {
  const merged = new Map<string, ShoppingItem>()

  for (const ingredient of ingredients) {
    const normalizedName = normalizeIngredientName(ingredient.name)
    const unit = ingredient.unit.trim()
    const key = `${normalizedName}|${unit.toLocaleLowerCase('de-DE')}`
    const existing = merged.get(key)

    if (existing) {
      existing.quantity += ingredient.quantity
    } else {
      merged.set(key, {
        id: key,
        name: ingredient.name.trim(),
        quantity: ingredient.quantity,
        unit,
        category: ingredient.category,
        checked: false,
      })
    }
  }

  return [...merged.values()]
}

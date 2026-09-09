import { ingredientCatalog } from '../data/ingredientCatalog'
import type { CatalogItem, GroceryCategory, Ingredient, ShoppingItem } from '../types'

const customCatalogKey = 'sonntagskueche:ingredient-catalog:v1'

function loadCustomCatalog(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(customCatalogKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is CatalogItem => Boolean(item?.name && item?.shoppingCategory)) : []
  } catch {
    return []
  }
}

function catalogItems(): CatalogItem[] {
  return [...ingredientCatalog, ...loadCustomCatalog()]
}

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

export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function findCatalogItem(name: string): CatalogItem | undefined {
  const normalized = normalizeSearchText(name)
  return catalogItems().find((item) => [item.name, ...(item.aliases ?? [])].some((candidate) => normalizeSearchText(candidate) === normalized))
}

export function searchCatalog(query: string): CatalogItem[] {
  const normalized = normalizeSearchText(query)
  if (!normalized) return []
  return catalogItems().filter((item) => [item.name, ...(item.aliases ?? [])].some((candidate) => normalizeSearchText(candidate).includes(normalized)))
}

export function saveCustomCatalogItem(name: string, shoppingCategory: GroceryCategory, defaultUnit = 'Stück'): CatalogItem {
  const item: CatalogItem = {
    id: `custom-${normalizeIngredientName(name)}-${Date.now()}`,
    name: name.trim(),
    shoppingCategory,
    type: 'food',
    defaultUnit,
  }
  try {
    localStorage.setItem(customCatalogKey, JSON.stringify([...loadCustomCatalog(), item]))
  } catch {
    // The ingredient remains usable in the current recipe if storage is unavailable.
  }
  return item
}

export function inferShoppingCategory(name: string, fallback: GroceryCategory = 'Sonstiges'): GroceryCategory {
  return findCatalogItem(name)?.shoppingCategory ?? fallback
}

export function createIngredient(name: string, quantity = 1, unit?: string): Ingredient {
  const catalogItem = findCatalogItem(name)
  const displayName = catalogItem?.name ?? name.trim()
  return {
    id: `${catalogItem?.id ?? normalizeIngredientName(displayName)}-${Date.now()}`,
    name: displayName,
    normalizedName: normalizeIngredientName(displayName),
    quantity,
    unit: unit ?? catalogItem?.defaultUnit ?? 'Stück',
    category: catalogItem?.shoppingCategory ?? 'Sonstiges',
  }
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
        category: inferShoppingCategory(ingredient.name, ingredient.category),
        checked: false,
      })
    }
  }

  return [...merged.values()]
}

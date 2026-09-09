import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Check,
  ClipboardList,
  CookingPot,
  Edit3,
  Minus,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import {
  createIngredient,
  formatQuantity,
  normalizeIngredientName,
  saveCustomCatalogItem,
  searchCatalog,
} from "./lib/ingredients";
import { generateShoppingList, groupByCategory } from "./lib/shopping-list";
import { MarkdownContent } from "./lib/markdown";
import { storage } from "./lib/storage";
import { supabase } from "./lib/supabase";
import { getSafeHttpUrl } from "./lib/urls";
import { validateImageFile } from "./lib/uploads";
import Login from "./components/Login";
import {
  GROCERY_CATEGORIES,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  UNITS,
  type GroceryCategory,
  type Ingredient,
  type MealType,
  type Recipe,
  type ShoppingItem,
  type Tab,
  type WeeklyPlan,
} from "./types";

const emptyPlan: WeeklyPlan = { mealSlots: [] };
const categoryColors = ["#e2b27e", "#9ebc9e", "#d99a8e", "#aab8d8", "#c9b68a"];
function newId(prefix: string) {
  return crypto.randomUUID();
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [tab, setTab] = useState<Tab>("planner");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan>(emptyPlan);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [hiddenShoppingIds, setHiddenShoppingIds] = useState<string[]>([]);
  const [recipeEditor, setRecipeEditor] = useState<Recipe | null>(null);
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);
  const [foodPickerMeal, setFoodPickerMeal] = useState<MealType | null>(null);
  const [recipeDetail, setRecipeDetail] = useState<{ recipe: Recipe; origin: "planner" | "recipes" } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setStorageError(error.message);
      setUser(data.session?.user ?? null);
      setSessionLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setDataReady(false);
      setRecipes([]);
      setPlan(emptyPlan);
      setShopping([]);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    setStorageError("");
    Promise.all([
      storage.loadRecipes([]),
      storage.loadPlan(emptyPlan),
      storage.loadShopping([]),
    ]).then(([loadedRecipes, loadedPlan, loadedShopping]) => {
      if (cancelled) return;
      setRecipes(loadedRecipes);
      setPlan(loadedPlan);
      setShopping(loadedShopping);
      setHiddenShoppingIds(loadedShopping.filter((item) => item.hidden).map((item) => item.id));
      setDataReady(true);
    }).catch((error: Error) => {
      if (!cancelled) setStorageError(error.message);
    }).finally(() => {
      if (!cancelled) setDataLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);
  const selectedRecipes = plan.mealSlots
    .map((slot) => ({
      slot,
      recipe: slot.recipeId
        ? recipes.find((recipe) => recipe.id === slot.recipeId)
        : undefined,
    }))
    .filter(
      (
        item,
      ): item is { slot: (typeof plan.mealSlots)[number]; recipe: Recipe } =>
        Boolean(item.recipe),
    );
  const baseShopping = useMemo(
    () => generateShoppingList(recipes, plan.mealSlots),
    [recipes, plan.mealSlots],
  );
  const generatedShopping = useMemo(
    () =>
      baseShopping.map((item) => ({
        ...item,
        checked: shopping.some(
          (stored) => stored.id === item.id && stored.checked,
        ),
      })),
    [baseShopping, shopping],
  );
  const visibleShopping = generatedShopping.filter(
    (item) => !hiddenShoppingIds.includes(item.id),
  );
  const shoppingGroups = groupByCategory(visibleShopping);
  const visibleRecipes = recipes.filter((recipe) =>
    recipe.name
      .toLocaleLowerCase("de-DE")
      .includes(search.toLocaleLowerCase("de-DE")),
  );

  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!dataReady || !user) return;
    void (async () => {
      setSaving(true);
      try { await storage.saveRecipes(recipes); } catch (error) { setStorageError((error as Error).message); } finally { setSaving(false); }
    })();
  }, [recipes, dataReady, user]);
  useEffect(() => {
    if (!dataReady || !user) return;
    void (async () => {
      setSaving(true);
      try { await storage.savePlan(plan); } catch (error) { setStorageError((error as Error).message); } finally { setSaving(false); }
    })();
  }, [plan, dataReady, user]);
  useEffect(() => {
    if (!dataReady || !user) return;
    const nextShopping = baseShopping.map((item) => ({
      ...item,
      checked: shopping.some(
        (stored) => stored.id === item.id && stored.checked,
      ),
      hidden: hiddenShoppingIds.includes(item.id),
    }));
    setShopping(nextShopping);
    void (async () => {
      setSaving(true);
      try { await storage.saveShopping(nextShopping); } catch (error) { setStorageError((error as Error).message); } finally { setSaving(false); }
    })();
  }, [baseShopping, dataReady, hiddenShoppingIds, user]);
  useEffect(() => {
    document.body.classList.toggle(
      "modal-open",
      Boolean(recipeEditor || pickerMeal || foodPickerMeal || recipeDetail),
    );
    return () => document.body.classList.remove("modal-open");
  }, [recipeEditor, pickerMeal, foodPickerMeal, recipeDetail]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }
  function saveRecipe(recipe: Recipe) {
    if (!recipe.category) {
      flash("Bitte wähle zuerst eine Kategorie aus.");
      return;
    }
    setRecipes((current) =>
      current.some((item) => item.id === recipe.id)
        ? current.map((item) => (item.id === recipe.id ? recipe : item))
        : [...current, recipe],
    );
    setRecipeEditor(null);
    flash("Rezept gespeichert");
  }
  function deleteRecipe(id: string) {
    if (!window.confirm("Rezept wirklich löschen?")) return;
    setRecipes((current) => current.filter((recipe) => recipe.id !== id));
    setPlan((current) => ({
      mealSlots: current.mealSlots.filter((slot) => slot.recipeId !== id),
    }));
    setRecipeEditor(null);
  }
  function addToMeal(mealType: MealType, recipeIds: string[]) {
    setPlan((current) => ({
      mealSlots: [
        ...current.mealSlots.filter(
          (slot) =>
            !(
              slot.mealType === mealType &&
              slot.recipeId &&
              recipeIds.includes(slot.recipeId)
            ),
        ),
        ...recipeIds.map((recipeId) => ({
          id: newId("slot"),
          recipeId,
          mealType,
          servings: 1,
        })),
      ],
    }));
    setPickerMeal(null);
  }
  function updateSlot(id: string, servings: number) {
    setPlan((current) => ({
      mealSlots: current.mealSlots.map((slot) =>
        slot.id === id ? { ...slot, servings: Math.max(1, servings) } : slot,
      ),
    }));
  }
  function updateShopping(id: string, changes: Partial<ShoppingItem>) {
    setShopping((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
    storage.saveShopping(
      shopping.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  if (sessionLoading) return <div className="auth-state">Anmeldung wird geprüft ...</div>;
  if (!user) return <Login />;
  if (dataLoading || !dataReady) return <div className="auth-state">Daten werden geladen ...</div>;
  if (storageError) return <div className="auth-state"><p>{storageError}</p><button className="primary-button" onClick={() => window.location.reload()}>Erneut versuchen</button></div>;

  return (
    <div className="app-shell">
      {saving && <div className="saving-indicator" role="status">Speichern ...</div>}
      <main className="main-content">
        {tab === "planner" && (
          <Planner
            slots={plan.mealSlots
              .map((slot) => ({
                slot,
                recipe: slot.recipeId
                  ? recipes.find((recipe) => recipe.id === slot.recipeId)
                  : undefined,
              }))
              .filter(
                (
                  item,
                ): item is {
                  slot: (typeof plan.mealSlots)[number];
                  recipe: Recipe | undefined;
                } => Boolean(item.recipe || item.slot.ingredient),
              )}
            onAdd={setPickerMeal}
            onAddFood={setFoodPickerMeal}
            onPreview={(imageUrl) => setImagePreview(imageUrl)}
            onSelect={(recipe) => setRecipeDetail({ recipe, origin: "planner" })}
            onUpdateSlot={updateSlot}
            onUpdateFood={(id, changes) =>
              setPlan((current) => ({
                mealSlots: current.mealSlots.map((slot) =>
                  slot.id === id && slot.ingredient
                    ? {
                        ...slot,
                        ingredient: {
                          ...slot.ingredient,
                          ...changes,
                          normalizedName: normalizeIngredientName(
                            changes.name ?? slot.ingredient.name,
                          ),
                        },
                      }
                    : slot,
                ),
              }))
            }
            onRemove={(id) =>
              setPlan((current) => ({
                mealSlots: current.mealSlots.filter((slot) => slot.id !== id),
              }))
            }
            onShopping={() => setTab("shopping")}
          />
        )}
        {tab === "recipes" && (
          <Recipes
            recipes={visibleRecipes}
            search={search}
            onSearch={setSearch}
            onAdd={() => setRecipeEditor(createRecipe())}
            onEdit={setRecipeEditor}
            onSelect={(recipe) => setRecipeDetail({ recipe, origin: "recipes" })}
            onPreview={(imageUrl) => setImagePreview(imageUrl)}
            selectedIds={plan.mealSlots.flatMap((slot) =>
              slot.recipeId ? [slot.recipeId] : [],
            )}
          />
        )}
        {tab === "shopping" && (
          <ShoppingList
            items={visibleShopping}
            groups={shoppingGroups}
            onToggle={(id) =>
              updateShopping(id, {
                checked: !visibleShopping.find((item) => item.id === id)
                  ?.checked,
              })
            }
            onDelete={(id) =>
              setHiddenShoppingIds((current) => [...current, id])
            }
          />
        )}
      </main>
      {pickerMeal && (
        <RecipePicker
          recipes={recipes}
          mealType={pickerMeal}
          selectedIds={plan.mealSlots
            .filter((slot) => slot.mealType === pickerMeal && slot.recipeId)
            .map((slot) => slot.recipeId!)}
          onConfirm={(ids) => addToMeal(pickerMeal, ids)}
          onAddFood={() => {
            setPickerMeal(null);
            setFoodPickerMeal(pickerMeal);
          }}
          onClose={() => setPickerMeal(null)}
        />
      )}
      {foodPickerMeal && (
        <FoodPicker
          mealType={foodPickerMeal}
          onConfirm={(ingredient) => {
            setPlan((current) => ({
              mealSlots: [
                ...current.mealSlots,
                {
                  id: newId("food"),
                  mealType: foodPickerMeal,
                  servings: 1,
                  ingredient,
                },
              ],
            }));
            setFoodPickerMeal(null);
            flash("Artikel zum Plan hinzugefügt");
          }}
          onClose={() => setFoodPickerMeal(null)}
        />
      )}
      {recipeEditor && (
        <RecipeForm
          recipe={recipeEditor}
          onSave={saveRecipe}
          onDelete={
            recipeEditor.name ? () => deleteRecipe(recipeEditor.id) : undefined
          }
          onClose={() => setRecipeEditor(null)}
        />
      )}
      {recipeDetail && (
        <RecipeDetail
          recipe={recipeDetail.recipe}
          origin={recipeDetail.origin}
          onClose={() => setRecipeDetail(null)}
          onEdit={() => {
            setRecipeEditor(recipeDetail.recipe);
            setRecipeDetail(null);
          }}
          onAddToPlanner={() => {
            setPlan((current) =>
              current.mealSlots.some(
                (slot) => slot.recipeId === recipeDetail.recipe.id,
              )
                ? current
                : {
                    mealSlots: [
                      ...current.mealSlots,
                      {
                        id: newId("slot"),
                        recipeId: recipeDetail.recipe.id,
                        mealType: "Mittagessen",
                        servings: 1,
                      },
                    ],
                  },
            );
            flash("Rezept zum Plan hinzugefügt");
          }}
        />
      )}
      {imagePreview && <ImageLightbox imageUrl={imagePreview} onClose={() => setImagePreview(null)} />}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      <nav className="bottom-nav" aria-label="Hauptnavigation">
        <NavButton
          active={tab === "planner"}
          icon={<Utensils size={21} />}
          label="Planer"
          onClick={() => setTab("planner")}
        />
        <NavButton
          active={tab === "recipes"}
          icon={<CookingPot size={21} />}
          label="Rezepte"
          onClick={() => setTab("recipes")}
        />
        <NavButton
          active={tab === "shopping"}
          icon={<ClipboardList size={21} />}
          label="Einkauf"
          count={
            visibleShopping.filter((item) => !item.checked).length || undefined
          }
          onClick={() => setTab("shopping")}
        />
      </nav>
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {count ? <b>{count}</b> : null}
    </button>
  );
}

function Planner({
  slots,
  onAdd,
  onAddFood,
  onSelect,
  onPreview,
  onUpdateSlot,
  onUpdateFood,
  onRemove,
  onShopping,
}: {
  slots: { slot: WeeklyPlan["mealSlots"][number]; recipe?: Recipe }[];
  onAdd: (meal: MealType) => void;
  onAddFood: (meal: MealType) => void;
  onSelect: (recipe: Recipe) => void;
  onPreview: (imageUrl: string) => void;
  onUpdateSlot: (id: string, servings: number) => void;
  onUpdateFood: (id: string, changes: Partial<Ingredient>) => void;
  onRemove: (id: string) => void;
  onShopping: () => void;
}) {
  return (
    <section className="page-section planner-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dein Mahlzeitenplan</p>
          <h1>Heute gut essen</h1>
          <p className="muted">
            {slots.length} geplante{" "}
            {slots.length === 1 ? "Mahlzeit" : "Mahlzeiten"}
          </p>
        </div>
      </div>
      <div className="meal-sections">
        {MEAL_TYPES.map((meal) => {
          const mealSlots = slots.filter(({ slot }) => slot.mealType === meal);
          return (
            <section className="meal-section" key={meal}>
              <div className="section-heading">
                <h2>{meal}</h2>
                <div className="section-actions">
                  <button className="small-add" onClick={() => onAdd(meal)}>
                    <Plus size={16} /> Rezept
                  </button>
                  <button className="small-add" onClick={() => onAddFood(meal)}>
                    <Plus size={16} /> Artikel hinzufügen
                  </button>
                </div>
              </div>
              {mealSlots.map(({ slot, recipe }, index) =>
                slot.ingredient ? (
                  <div className="meal-row" key={slot.id}>
                    <div className="meal-icon food-icon">
                      {slot.ingredient.name.slice(0, 1)}
                    </div>
                    <div className="meal-copy">
                      <strong>{slot.ingredient.name}</strong>
                      <span>
                        {formatQuantity(
                          slot.ingredient.quantity,
                          slot.ingredient.unit,
                        )}
                      </span>
                    </div>
                    <input
                      className="inline-quantity"
                      aria-label={`${slot.ingredient.name} Menge`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={slot.ingredient.quantity}
                      onChange={(event) =>
                        onUpdateFood(slot.id, {
                          quantity: Math.max(0.1, Number(event.target.value)),
                        })
                      }
                    />
                    <select
                      className="inline-unit"
                      aria-label={`${slot.ingredient.name} Einheit`}
                      value={slot.ingredient.unit}
                      onChange={(event) =>
                        onUpdateFood(slot.id, { unit: event.target.value })
                      }
                    >
                      {UNITS.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                    <button
                      className="delete-button"
                      aria-label={`${slot.ingredient.name} entfernen`}
                      onClick={() => onRemove(slot.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ) : recipe ? (
                  <div className="meal-row" key={slot.id}>
                    <RecipeThumb
                      recipe={recipe}
                      color={categoryColors[index % categoryColors.length]}
                      onSelect={() => onSelect(recipe)}
                      onPreview={() => recipe.imageUrl && onPreview(recipe.imageUrl)}
                    />
                    <div className="meal-copy">
                      <button className="meal-title-button" onClick={() => onSelect(recipe)}>
                        {recipe.name}
                      </button>
                      <span>
                        {recipe.category} · {recipe.ingredients.length} Zutaten
                      </span>
                    </div>
                    <div className="portion-stepper">
                      <button
                        aria-label="Portion verringern"
                        onClick={() => onUpdateSlot(slot.id, slot.servings - 1)}
                      >
                        <Minus size={15} />
                      </button>
                      <strong>{slot.servings}</strong>
                      <button
                        aria-label="Portion erhöhen"
                        onClick={() => onUpdateSlot(slot.id, slot.servings + 1)}
                      >
                        <Plus size={15} />
                      </button>
                      <small>Portionen</small>
                    </div>
                    <button
                      className="delete-button"
                      aria-label={`${recipe.name} entfernen`}
                      onClick={() => onRemove(slot.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ) : null,
              )}
              {mealSlots.length === 0 && (
                <p className="muted meal-empty">Noch nichts geplant</p>
              )}
            </section>
          );
        })}
      </div>
      <button className="list-preview" onClick={onShopping}>
        <div className="list-preview-icon">
          <ClipboardList size={20} />
        </div>
        <div>
          <strong>Einkaufsliste</strong>
          <span>Automatisch aus deinem Plan erstellt</span>
        </div>
      </button>
    </section>
  );
}

function Recipes({
  recipes,
  search,
  onSearch,
  onAdd,
  onEdit,
  onSelect,
  onPreview,
  selectedIds,
}: {
  recipes: Recipe[];
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  onEdit: (recipe: Recipe) => void;
  onSelect: (recipe: Recipe) => void;
  onPreview: (imageUrl: string) => void;
  selectedIds: string[];
}) {
  const [category, setCategory] = useState("Alle");
  const filtered = recipes.filter(
    (recipe) => category === "Alle" || recipe.category === category,
  );
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Deine Sammlung</p>
          <h1>Rezepte</h1>
          <p className="muted">{filtered.length} Lieblingsgerichte</p>
        </div>
        <button
          className="round-action"
          aria-label="Rezept hinzufügen"
          onClick={onAdd}
        >
          <Plus size={23} />
        </button>
      </div>
      <label className="search-field">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Rezept suchen"
        />
      </label>
      <div className="filter-row">
        <button
          className={
            category === "Alle" ? "filter-button active" : "filter-button"
          }
          onClick={() => setCategory("Alle")}
        >
          Alle
        </button>
        {RECIPE_CATEGORIES.map((item) => (
          <button
            className={
              category === item ? "filter-button active" : "filter-button"
            }
            key={item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="recipe-grid">
        {filtered.map((recipe, index) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            color={categoryColors[index % categoryColors.length]}
            selected={selectedIds.includes(recipe.id)}
            onEdit={() => onEdit(recipe)}
            onSelect={() => onSelect(recipe)}
            onPreview={() => recipe.imageUrl && onPreview(recipe.imageUrl)}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <EmptyState
          icon={<CookingPot size={30} />}
          title="Keine passenden Rezepte"
          text="Ändere deine Suche oder wähle eine andere Kategorie."
        />
      )}
    </section>
  );
}

function RecipeCard({
  recipe,
  color,
  selected,
  onEdit,
  onSelect,
  onPreview,
}: {
  recipe: Recipe;
  color: string;
  selected: boolean;
  onEdit: () => void;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <article className={`recipe-card ${selected ? "selected" : ""}`}>
      <button
        className="recipe-visual"
        style={recipe.imageUrl ? undefined : { background: color }}
        onClick={onSelect}
      >
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt="" />
        ) : (
          <span>{recipe.name.slice(0, 1)}</span>
        )}
      </button>
      {recipe.imageUrl && <button className="image-preview-button" aria-label={`${recipe.name} Bild vergrößern`} onClick={(event) => { event.stopPropagation(); onPreview(); }}><Search size={16} /></button>}
      <div className="recipe-body">
        <div className="recipe-info">
          <span className="category-label">{recipe.category}</span>
          <h3>{recipe.name}</h3>
          <p>
            {recipe.ingredients.length} Zutaten · {recipe.servings ?? 4}{" "}
            Portionen
          </p>
        </div>
        <div className="card-actions">
          <button
            aria-label={`${recipe.name} bearbeiten`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Edit3 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
function RecipeThumb({ recipe, color, onSelect, onPreview }: { recipe: Recipe; color: string; onSelect: () => void; onPreview: () => void }) {
  return (
    <button className="meal-icon" style={recipe.imageUrl ? undefined : { background: color }} onClick={onSelect} aria-label={`${recipe.name} öffnen`}>
      {recipe.imageUrl ? <img src={recipe.imageUrl} alt="" /> : recipe.name.slice(0, 1)}
    </button>
  );
}

function ImageLightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return <div className="image-lightbox" role="dialog" aria-label="Bildansicht" onClick={onClose}><button className="icon-button" aria-label="Bildansicht schließen" onClick={onClose}><X size={22} /></button><img src={imageUrl} alt="Vergrößerte Rezeptansicht" onClick={(event) => event.stopPropagation()} /></div>;
}
function ShoppingList({
  items,
  groups,
  onToggle,
  onDelete,
}: {
  items: ShoppingItem[];
  groups: Record<string, ShoppingItem[]>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const openCount = items.filter((item) => !item.checked).length;
  return (
    <section className="page-section shopping-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Gut vorbereitet</p>
          <h1>Einkaufsliste</h1>
          <p className="muted">
            {openCount} offene {openCount === 1 ? "Position" : "Positionen"}
          </p>
        </div>
        <div className="basket-mark">
          <ClipboardList size={24} />
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={30} />}
          title="Deine Einkaufsliste ist leer"
          text="Plane eine Mahlzeit, dann sammeln wir die Zutaten automatisch für dich."
        />
      ) : (
        <div className="shopping-groups">
          {Object.entries(groups).map(([category, categoryItems]) => (
            <div className="shopping-group" key={category}>
              <h2>{category}</h2>
              {categoryItems.map((item) => (
                <div
                  className={`shopping-item ${item.checked ? "checked" : ""}`}
                  key={item.id}
                >
                  <button
                    className="check-button"
                    aria-label={`${item.name} abhaken`}
                    onClick={() => onToggle(item.id)}
                  >
                    {item.checked && <Check size={16} />}
                  </button>
                  <div className="shopping-copy">
                    <strong>
                      {formatQuantity(item.quantity, item.unit)} {item.name}
                    </strong>
                    {item.checked && <span>Erledigt</span>}
                  </div>
                  <button
                    className="delete-button"
                    aria-label={`${item.name} löschen`}
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecipePicker({
  recipes,
  mealType,
  selectedIds,
  onConfirm,
  onAddFood,
  onClose,
}: {
  recipes: Recipe[];
  mealType: MealType;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onAddFood: () => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState(selectedIds);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Alle");
  const filtered = recipes.filter(
    (recipe) =>
      (category === "Alle" || recipe.category === category) &&
      recipe.name
        .toLocaleLowerCase("de-DE")
        .includes(query.toLocaleLowerCase("de-DE")),
  );
  return (
    <div className="modal-backdrop">
      <div className="modal-sheet picker-sheet">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mealType}</p>
            <h2>Rezepte auswählen</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={21} />
          </button>
        </div>
        <button className="secondary-button full-width" onClick={onAddFood}>
          <Plus size={17} /> Einzelnen Artikel auswählen
        </button>
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rezept suchen"
          />
        </label>
        <div className="filter-row">
          {["Alle", ...RECIPE_CATEGORIES].map((item) => (
            <button
              className={
                category === item ? "filter-button active" : "filter-button"
              }
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="picker-grid">
          {filtered.map((recipe, index) => (
            <button
              className={`picker-card ${selection.includes(recipe.id) ? "selected" : ""}`}
              key={recipe.id}
              onClick={() =>
                setSelection((current) =>
                  current.includes(recipe.id)
                    ? current.filter((id) => id !== recipe.id)
                    : [...current, recipe.id],
                )
              }
            >
              <div
                className="picker-image"
                style={recipe.imageUrl ? undefined : { background: categoryColors[index % categoryColors.length] }}
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt="" />
                ) : (
                  recipe.name.slice(0, 1)
                )}
                {selection.includes(recipe.id) && (
                  <span className="selected-mark">
                    <Check size={16} />
                  </span>
                )}
              </div>
              <strong>{recipe.name}</strong>
              <small>{recipe.category}</small>
            </button>
          ))}
        </div>
        <div className="picker-actions">
          <button
            className="primary-button full-width"
            onClick={() => onConfirm(selection)}
          >
            Auswahl bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

function FoodPicker({
  mealType,
  onConfirm,
  onClose,
}: {
  mealType: MealType;
  onConfirm: (ingredient: Ingredient) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [customName, setCustomName] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState<GroceryCategory>("Sonstiges");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("Stück");
  const filtered = searchCatalog(query);
  return (
    <div className="modal-backdrop">
      <div className="modal-sheet picker-sheet">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mealType}</p>
            <h2>Artikel hinzufügen</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={21} />
          </button>
        </div>
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Artikel suchen"
          />
        </label>
        <div className="suggestion-list food-suggestions">
          {filtered.map((item) => (
            <button
              className={selected === item.name ? "selected" : ""}
              key={item.id}
              onClick={() => {
                setSelected(item.name);
                setCustomOpen(false);
                setCustomName("");
                setUnit(item.defaultUnit ?? "Stück");
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        {query && filtered.length === 0 && (
          <div className="custom-ingredient-panel">
            {!customOpen ? (
              <button
                className="secondary-button full-width"
                onClick={() => {
                  setCustomName(query.trim());
                  setCustomOpen(true);
                }}
              >
                <Plus size={17} /> Eigenen Eintrag hinzufügen
              </button>
            ) : (
              <div className="food-details custom-food-details">
                <strong>Eigenen Eintrag hinzufügen</strong>
                <label>
                  Name
                  <input
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder={query}
                  />
                </label>
                <label>
                  Kategorie
                  <select
                    value={customCategory}
                    onChange={(event) =>
                      setCustomCategory(event.target.value as GroceryCategory)
                    }
                  >
                    {GROCERY_CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        )}
        {(selected || customOpen) && (
          <div className="food-details">
            <strong>{selected}</strong>
            <label>
              Menge
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(0.1, Number(event.target.value)))
                }
              />
            </label>
            <label>
              Einheit
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
              >
                {UNITS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="picker-actions">
          <button
            className="primary-button full-width"
            disabled={!selected && !customName.trim()}
            onClick={() => {
              const ingredient = createIngredient(selected || customName, quantity, unit);
              onConfirm({
                ...ingredient,
                category: selected ? ingredient.category : customCategory,
              });
            }}
          >
            Artikel hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipeForm({
  recipe,
  onSave,
  onDelete,
  onClose,
}: {
  recipe: Recipe;
  onSave: (recipe: Recipe) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Recipe>({
    ...recipe,
    servings: recipe.servings ?? 4,
  });
  const [error, setError] = useState("");
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [ingredientSearchOpen, setIngredientSearchOpen] = useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(recipe.ingredients.map((item) => [item.id, String(item.quantity)])),
  );
  const [customIngredientOpen, setCustomIngredientOpen] = useState(false);
  const [customIngredientName, setCustomIngredientName] = useState("");
  const [customIngredientCategory, setCustomIngredientCategory] = useState<GroceryCategory>("Sonstiges");
  const [preparationImageStep, setPreparationImageStep] = useState(0);
  function updateIngredient(id: string, changes: Partial<Ingredient>) {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
              normalizedName: normalizeIngredientName(
                changes.name ?? item.name,
              ),
            }
          : item,
      ),
    }));
  }
  function addIngredient(name: string) {
    const ingredient = createIngredient(name);
    setDraft((current) => ({
      ...current,
      ingredients: [ingredient, ...current.ingredients],
    }));
    setQuantityDrafts((current) => ({ ...current, [ingredient.id]: String(ingredient.quantity) }));
    setIngredientQuery("");
    setCustomIngredientName("");
    setCustomIngredientOpen(false);
    setIngredientSearchOpen(false);
  }
  function addCustomIngredient() {
    const name = customIngredientName.trim() || ingredientQuery.trim();
    if (!name) return setError("Bitte gib einen Namen für die eigene Zutat ein.");
    const catalogItem = saveCustomCatalogItem(name, customIngredientCategory);
    const ingredient = {
      ...createIngredient(catalogItem.name, 1, catalogItem.defaultUnit),
      category: catalogItem.shoppingCategory,
    };
    setDraft((current) => ({ ...current, ingredients: [ingredient, ...current.ingredients] }));
    setQuantityDrafts((current) => ({ ...current, [ingredient.id]: String(ingredient.quantity) }));
    setIngredientQuery("");
    setCustomIngredientName("");
    setCustomIngredientOpen(false);
    setIngredientSearchOpen(false);
  }
  function save() {
    if (!draft.name.trim())
      return setError("Bitte gib dem Rezept einen Namen.");
    if (!draft.category)
      return setError("Bitte wähle zuerst eine Kategorie aus.");
    if (draft.videoUrl?.trim() && !getSafeHttpUrl(draft.videoUrl))
      return setError("Der Videolink muss mit http:// oder https:// beginnen.");
    if (!Number.isFinite(draft.servings) || (draft.servings ?? 0) < 1)
      return setError("Portionen müssen mindestens 1 sein.");
    const parsedIngredients = draft.ingredients.map((item) => ({
      ...item,
      quantity: Number.parseFloat(quantityDrafts[item.id] ?? String(item.quantity)),
    }));
    if (
      parsedIngredients.length === 0 ||
      parsedIngredients.some(
        (item) =>
          !item.name.trim() ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !item.unit,
      )
    )
      return setError("Bitte gib für jede Zutat eine gültige Menge grösser als 0 ein.");
    onSave({
      ...draft,
      name: draft.name.trim(),
      servings: Math.floor(draft.servings ?? 1),
      ingredients: parsedIngredients.map((item) => ({
        ...item,
        name: item.name.trim(),
        normalizedName: normalizeIngredientName(item.name),
      })),
    });
  }
  function uploadImage(file: File) {
    validateImageFile(file, { bucket: "recipe-covers", recipeId: draft.id })
      .then(({ storagePath, imageUrl }) => setDraft((current) => ({ ...current, imagePath: storagePath, imageUrl })))
      .catch((uploadError: Error) => setError(uploadError.message));
  }
  function uploadPreparationImage(file: File) {
    if ((draft.preparationImages?.length ?? 0) >= 8)
      return setError("Pro Rezept sind höchstens 8 Zubereitungsbilder möglich.");
    validateImageFile(file, { bucket: "preparation-images", recipeId: draft.id })
      .then(({ storagePath, imageUrl }) => setDraft((current) => ({
        ...current,
        preparationImages: [
          ...(current.preparationImages ?? []),
          { id: newId("preparation-image"), storagePath, imageUrl, step: preparationImageStep },
        ],
      })))
      .catch((uploadError: Error) => setError(uploadError.message));
  }
  const suggestions = searchCatalog(ingredientQuery).map((item) => item.name);
  return (
    <div className="modal-backdrop">
      <div className="modal-sheet form-sheet">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Rezepteditor</p>
            <h2>{recipe.name ? "Rezept bearbeiten" : "Neues Rezept"}</h2>
            {onDelete && (
              <button
                className="danger-button editor-delete"
                onClick={onDelete}
              >
                <Trash2 size={17} /> Rezept löschen
              </button>
            )}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={21} />
          </button>
        </div>
        <div className="form-fields">
          <label>
            Rezeptname
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              placeholder="z. B. Ofengemüse"
            />
          </label>
          <label>
            Kategorie
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value })
              }
            >
              <option value="">Bitte auswählen</option>
              {RECIPE_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            {!draft.category && error && <p className="form-error">{error}</p>}
          </label>
          <div className="servings-field">
            <span>Portionen</span>
            <div className="portion-input">
              <button
                aria-label="Portion verringern"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    servings: Math.max(1, (current.servings ?? 1) - 1),
                  }))
                }
              >
                <Minus size={16} />
              </button>
              <input
                aria-label="Portionen"
                type="number"
                min="1"
                step="1"
                value={draft.servings}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    servings: Math.max(1, Number(event.target.value)),
                  })
                }
              />
              <button
                aria-label="Portion erhöhen"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    servings: (current.servings ?? 1) + 1,
                  }))
                }
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <label className="image-upload">
            Bild
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                event.target.files?.[0] && uploadImage(event.target.files[0])
              }
            />
          </label>
          <div className="image-upload">
            <label>
              Bilder zu Zubereitungsschritten
              <input
                type="number"
                min="0"
                step="1"
                value={preparationImageStep}
                onChange={(event) => setPreparationImageStep(Math.max(0, Number(event.target.value) || 0))}
                placeholder="Zeile, nach der das Bild erscheint"
              />
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => event.target.files?.[0] && uploadPreparationImage(event.target.files[0])}
            />
            <div className="preparation-image-list">
              {(draft.preparationImages ?? []).map((image) => (
                <div className="preparation-image-item" key={image.id}>
                  {image.imageUrl && <img src={image.imageUrl} alt="" />}
                  <label>
                    Position
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={image.step}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        preparationImages: (current.preparationImages ?? []).map((item) => item.id === image.id ? { ...item, step: Math.max(0, Number(event.target.value) || 0) } : item),
                      }))}
                    />
                  </label>
                  <button className="delete-button" aria-label="Zubereitungsbild entfernen" onClick={() => setDraft((current) => ({ ...current, preparationImages: (current.preparationImages ?? []).filter((item) => item.id !== image.id) }))}>
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <label>
            Zubereitungsschritte
            <textarea
              rows={8}
              value={draft.preparation ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  preparation: event.target.value,
                })
              }
              placeholder="Schritte, Absätze oder Bullet Points eingeben"
            />
          </label>
          <div className="form-fields-two">
            <label>
              Zubereitungszeit
              <input
                value={draft.preparationTime ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, preparationTime: event.target.value })
                }
                placeholder="z. B. 35 Min."
              />
            </label>
            <label>
              Schwierigkeit
              <input
                value={draft.difficulty ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, difficulty: event.target.value })
                }
                placeholder="z. B. Einfach"
              />
            </label>
          </div>
          <label>
            Videolink
            <input
              type="url"
              value={draft.videoUrl ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, videoUrl: event.target.value })
              }
              placeholder="https://..."
            />
          </label>
          <label>
            Notizen
            <textarea
              rows={3}
              value={draft.notes ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
              placeholder="Optionale Hinweise"
            />
          </label>
          <div className="ingredients-heading">
            <h3>Zutaten</h3>
            <button
              className="ingredient-add-button"
              onClick={() => setIngredientSearchOpen((current) => !current)}
            >
              <Plus size={17} /> Zutat hinzufügen
            </button>
          </div>
          {ingredientSearchOpen && (
            <div className="ingredient-search-panel">
              <label>
                Zutat suchen
                <div className="search-field">
                  <Search size={17} />
                  <input
                    value={ingredientQuery}
                    onChange={(event) => setIngredientQuery(event.target.value)}
                    placeholder="Häufige Zutaten finden"
                  />
                </div>
              </label>
              <div className="suggestion-list">
                {suggestions.map((name) => (
                  <button key={name} onClick={() => addIngredient(name)}>
                    {name}
                  </button>
                ))}
              </div>
              {ingredientQuery.trim() && suggestions.length === 0 && (
                <div className="custom-ingredient-panel">
                  <p className="form-error">Keine passende Zutat gefunden.</p>
                  {!customIngredientOpen ? (
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setCustomIngredientName(ingredientQuery.trim());
                        setCustomIngredientOpen(true);
                      }}
                    >
                      <Plus size={17} /> Eigene Zutat hinzufügen
                    </button>
                  ) : (
                    <div className="form-fields-two">
                      <label>
                        Name
                        <input
                          value={customIngredientName}
                          onChange={(event) => setCustomIngredientName(event.target.value)}
                          placeholder={ingredientQuery}
                        />
                      </label>
                      <label>
                        Einkaufskategorie
                        <select value={customIngredientCategory} onChange={(event) => setCustomIngredientCategory(event.target.value as GroceryCategory)}>
                          {GROCERY_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                        </select>
                      </label>
                      <button className="primary-button" onClick={addCustomIngredient}>Zutat übernehmen</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {draft.ingredients.map((item) => (
            <div className="ingredient-card" key={item.id}>
              <div className="ingredient-name">
                <span>Zutat</span>
                <input aria-label="Zutat" value={item.name} readOnly />
              </div>
              <div className="ingredient-measure">
                <label>
                  Menge
                  <input
                    aria-label="Menge"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={quantityDrafts[item.id] ?? String(item.quantity)}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setQuantityDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                    onBlur={() => {
                      const value = Number.parseFloat(quantityDrafts[item.id] ?? "");
                      if (!Number.isFinite(value) || value <= 0) setError("Die Menge muss grösser als 0 sein.");
                      else {
                        updateIngredient(item.id, { quantity: value });
                        setError("");
                      }
                    }}
                  />
                </label>
                <label>
                  Einheit
                  <select
                    aria-label="Einheit"
                    value={item.unit}
                    onChange={(event) =>
                      updateIngredient(item.id, { unit: event.target.value })
                    }
                  >
                    {UNITS.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="ingredient-category">
                <span>Einkaufskategorie</span>
                <strong>{item.category}</strong>
              </div>
              <button
                className="delete-button ingredient-delete"
                aria-label="Zutat entfernen"
                onClick={() =>
                  setDraft({
                    ...draft,
                    ingredients: draft.ingredients.filter(
                      (ingredient) => ingredient.id !== item.id,
                    ),
                  })
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="form-actions">
          <button className="primary-button full-width" onClick={save}>
            Rezept speichern
          </button>
        </div>
      </div>
    </div>
  );
}
function RecipeDetail({
  recipe,
  origin,
  onClose,
  onEdit,
  onAddToPlanner,
}: {
  recipe: Recipe;
  origin: "planner" | "recipes";
  onClose: () => void;
  onEdit: () => void;
  onAddToPlanner: () => void;
}) {
  const safeVideoUrl = getSafeHttpUrl(recipe.videoUrl);
  return (
    <div className="modal-backdrop recipe-detail-backdrop">
      <article className="modal-sheet recipe-detail">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Rezeptdetail</p>
            <h2>{recipe.name}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={origin === "planner" ? "Zurück zum Planer" : "Zurück zu den Rezepten"}
          >
            <X size={21} />
          </button>
        </div>
        {recipe.imageUrl ? (
          <img
            className="detail-image"
            src={recipe.imageUrl}
            alt={recipe.name}
          />
        ) : (
          <div className="detail-fallback">{recipe.name.slice(0, 1)}</div>
        )}
        <div className="detail-meta">
          <span className="category-label">{recipe.category}</span>
          <span>{recipe.servings ?? 4} Portionen</span>
          {recipe.preparationTime && <span>{recipe.preparationTime}</span>}
          {recipe.difficulty && <span>{recipe.difficulty}</span>}
        </div>
        <section>
          <h3>Zutaten</h3>
          <ul>
            {recipe.ingredients.map((item) => (
              <li key={item.id}>
                {formatQuantity(item.quantity, item.unit)} {item.name}
              </li>
            ))}
          </ul>
        </section>
        {(recipe.preparation?.trim() || recipe.preparationImages?.length) && (
          <section>
            <h3>Zubereitung</h3>
            <MarkdownContent content={recipe.preparation ?? ""} />
            {recipe.preparationImages?.map((image) => (
              image.imageUrl ? <img className="preparation-detail-image" key={image.id} src={image.imageUrl} alt={`Zubereitungsbild nach Schritt ${image.step + 1}`} /> : null
            ))}
          </section>
        )}
        {recipe.notes && (
          <section>
            <h3>Notizen</h3>
            <p>{recipe.notes}</p>
          </section>
        )}
        {safeVideoUrl && (
          <a
            className="secondary-button full-width"
            href={safeVideoUrl}
            target="_blank"
            rel="noreferrer"
          >
            Video ansehen
          </a>
        )}
        <div className="detail-actions">
          <button className="secondary-button" onClick={onEdit}>
            <Edit3 size={17} /> Bearbeiten
          </button>
          <button className="primary-button" onClick={onAddToPlanner}>
            <Plus size={17} /> Zum Planer hinzufügen
          </button>
        </div>
      </article>
    </div>
  );
}
function EmptyState({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
function createRecipe(): Recipe {
  return {
    id: newId("recipe"),
    name: "",
    category: "",
    servings: 4,
    ingredients: [],
  };
}

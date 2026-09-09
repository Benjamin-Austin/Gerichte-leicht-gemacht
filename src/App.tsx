import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { seedRecipes } from "./data/seedRecipes";
import {
  createIngredient,
  formatQuantity,
  normalizeIngredientName,
  searchCatalog,
} from "./lib/ingredients";
import { generateShoppingList, groupByCategory } from "./lib/shopping-list";
import { storage } from "./lib/storage";
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
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("planner");
  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    storage.loadRecipes(seedRecipes),
  );
  const [plan, setPlan] = useState<WeeklyPlan>(() =>
    storage.loadPlan(emptyPlan),
  );
  const [shopping, setShopping] = useState<ShoppingItem[]>(() =>
    storage.loadShopping([]),
  );
  const [hiddenShoppingIds, setHiddenShoppingIds] = useState<string[]>([]);
  const [recipeEditor, setRecipeEditor] = useState<Recipe | null>(null);
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);
  const [foodPickerMeal, setFoodPickerMeal] = useState<MealType | null>(null);
  const [recipeDetail, setRecipeDetail] = useState<Recipe | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
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

  useEffect(() => {
    storage.saveRecipes(recipes);
  }, [recipes]);
  useEffect(() => {
    storage.savePlan(plan);
  }, [plan]);
  useEffect(() => {
    const nextShopping = baseShopping.map((item) => ({
      ...item,
      checked: shopping.some(
        (stored) => stored.id === item.id && stored.checked,
      ),
    }));
    setShopping(nextShopping);
    storage.saveShopping(nextShopping);
  }, [baseShopping]);
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

  return (
    <div className="app-shell">
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
            onSelect={setRecipeDetail}
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
          recipe={recipeDetail}
          onClose={() => setRecipeDetail(null)}
          onEdit={() => {
            setRecipeEditor(recipeDetail);
            setRecipeDetail(null);
          }}
          onAddToPlanner={() => {
            setPlan((current) =>
              current.mealSlots.some(
                (slot) => slot.recipeId === recipeDetail.id,
              )
                ? current
                : {
                    mealSlots: [
                      ...current.mealSlots,
                      {
                        id: newId("slot"),
                        recipeId: recipeDetail.id,
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
  onPreview,
  onUpdateSlot,
  onUpdateFood,
  onRemove,
  onShopping,
}: {
  slots: { slot: WeeklyPlan["mealSlots"][number]; recipe?: Recipe }[];
  onAdd: (meal: MealType) => void;
  onAddFood: (meal: MealType) => void;
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
                      onPreview={() => recipe.imageUrl && onPreview(recipe.imageUrl)}
                    />
                    <div className="meal-copy">
                      <strong>{recipe.name}</strong>
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
        style={{ background: color }}
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
function RecipeThumb({ recipe, color, onPreview }: { recipe: Recipe; color: string; onPreview: () => void }) {
  return (
    <button className="meal-icon" style={{ background: color }} onClick={(event) => { event.stopPropagation(); onPreview(); }} aria-label={`${recipe.name} Bild vergrößern`} disabled={!recipe.imageUrl}>
      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt="" />
      ) : (
        recipe.name.slice(0, 1)
      )}
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
                style={{
                  background: categoryColors[index % categoryColors.length],
                }}
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
                setUnit(item.defaultUnit ?? "Stück");
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        {query && filtered.length === 0 && (
          <div className="food-details custom-food-details">
            <strong>Eigenen Eintrag hinzufügen</strong>
            <label>Name<input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder={query} /></label>
            <label>Kategorie<select value={customCategory} onChange={(event) => setCustomCategory(event.target.value as GroceryCategory)}>{GROCERY_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          </div>
        )}
        {selected && (
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
            onClick={() =>
              onConfirm({ ...createIngredient(selected || customName, quantity, unit), category: selected ? createIngredient(selected, quantity, unit).category : customCategory })
            }
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
    setDraft((current) => ({
      ...current,
      ingredients: [createIngredient(name), ...current.ingredients],
    }));
    setIngredientQuery("");
    setIngredientSearchOpen(false);
  }
  function save() {
    if (!draft.name.trim())
      return setError("Bitte gib dem Rezept einen Namen.");
    if (!draft.category)
      return setError("Bitte wähle zuerst eine Kategorie aus.");
    if (!Number.isFinite(draft.servings) || (draft.servings ?? 0) < 1)
      return setError("Portionen müssen mindestens 1 sein.");
    if (
      draft.ingredients.length === 0 ||
      draft.ingredients.some(
        (item) =>
          !item.name.trim() ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !item.unit,
      )
    )
      return setError("Bitte fülle alle Zutaten vollständig aus.");
    onSave({
      ...draft,
      name: draft.name.trim(),
      servings: Math.floor(draft.servings ?? 1),
      ingredients: draft.ingredients.map((item) => ({
        ...item,
        name: item.name.trim(),
        normalizedName: normalizeIngredientName(item.name),
      })),
    });
  }
  function uploadImage(file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type))
      return setError("Bitte wähle ein JPG-, PNG- oder WebP-Bild aus.");
    if (file.size > 2_000_000)
      return setError("Das Bild darf höchstens 2 MB gross sein.");
    const reader = new FileReader();
    reader.onerror = () => setError("Das Bild konnte nicht gelesen werden.");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => setError("Die Bilddatei ist ungültig.");
      image.onload = () => {
        if (image.width > 4096 || image.height > 4096)
          return setError(
            "Das Bild darf höchstens 4096 Pixel breit oder hoch sein.",
          );
        setDraft((current) => ({
          ...current,
          imageUrl: String(reader.result),
        }));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
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
          <label>
            Zubereitungsschritte
            <textarea
              rows={4}
              value={(draft.preparation ?? []).join("\n")}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  preparation: event.target.value
                    .split("\n")
                    .map((step) => step.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Jeden Schritt in eine neue Zeile schreiben"
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
                    value={item.quantity}
                    onChange={(event) =>
                      updateIngredient(item.id, {
                        quantity: Number(event.target.value),
                      })
                    }
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
  onClose,
  onEdit,
  onAddToPlanner,
}: {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onAddToPlanner: () => void;
}) {
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
            aria-label="Schließen"
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
        {recipe.preparation && recipe.preparation.length > 0 && (
          <section>
            <h3>Zubereitung</h3>
            <ol>
              {recipe.preparation.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ol>
          </section>
        )}
        {recipe.notes && (
          <section>
            <h3>Notizen</h3>
            <p>{recipe.notes}</p>
          </section>
        )}
        {recipe.videoUrl && (
          <a
            className="secondary-button full-width"
            href={recipe.videoUrl}
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

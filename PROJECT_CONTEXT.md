# Sonntagsküche – Project Context

## 1. Projektübersicht

**Sonntagsküche** ist eine persönliche Rezept-, Mahlzeitenplan- und Einkaufsliste-App. Sie richtet sich aktuell an eine einzelne Person, die Rezepte verwalten, Mahlzeiten planen und daraus eine Einkaufsliste ableiten möchte.

Die App befindet sich in einem funktionsfähigen clientseitigen Entwicklungsstand. Sie enthält keine Benutzerkonten, keine Cloud-Synchronisation und kein Backend. Rezepte, Planer und Einkaufsliste bleiben im jeweiligen Browser gespeichert.

Hauptfunktionen:

- Rezepte suchen, filtern, erstellen, bearbeiten und löschen
- Zutaten und Portionen pro Rezept verwalten
- Bilder zu Rezepten hinzufügen
- Rezepte bestimmten Mahlzeiten zuordnen
- einzelne Lebensmittel direkt in den Plan aufnehmen
- automatische Einkaufsliste aus dem aktuellen Plan erzeugen
- Einkaufspunkte abhaken oder aus der Ansicht entfernen

## 2. Tech Stack

| Bereich | Technologie | Verwendung |
|---|---|---|
| Frontend | React 19 | UI und Komponentenstruktur |
| Sprache | TypeScript | Typen, State- und Geschäftslogik |
| Build Tool | Vite | Entwicklungsserver und Produktionsbuild |
| Styling | CSS in `src/styles.css` | Responsive, mobile-first Oberfläche |
| UI Icons | `lucide-react` | Icons für Navigation und Aktionen |
| Tests | Vitest | Tests für Zutaten- und Einkaufslogik |
| Persistenz | Browser `localStorage` | Rezepte, Plan und Einkaufsliste |
| Hosting-Konfiguration | Vercel-Konfiguration | Security-Header für statische Auslieferung |
| Datenbank | Keine | Aktuell nicht vorhanden |
| Authentication | Keine | Aktuell nicht vorhanden |

Zusätzlich werden Google Fonts (`DM Sans` und `Fraunces`) in `src/styles.css` eingebunden.

## 3. Architektur

```text
Benutzer
  ↓
React-App (`src/App.tsx`)
  ├── Rezepte, Planer und Einkauf als Tabs
  ├── lokale State-Verwaltung mit React Hooks
  ├── Zutaten-/Einkaufslogik aus `src/lib/`
  └── `src/lib/storage.ts`
        ↓
Browser-localStorage
```

Die Anwendung läuft vollständig clientseitig. Es gibt keine Server-Komponenten, keine API-Routen, keine Datenbank und keine Authentifizierung.

`App.tsx` hält den zentralen Anwendungszustand. Änderungen an Rezepten und Plan werden über `storage.ts` in `localStorage` geschrieben. Die Einkaufsliste wird aus Rezepten und Planer-Einträgen berechnet und anschließend ebenfalls lokal gespeichert.

Daten sind an Browser und Gerät gebunden. Ein Deployment auf Vercel veröffentlicht die Anwendung, synchronisiert aber keine lokalen Rezepte zwischen iPhone und PC.

## 4. Projektstruktur

```text
.
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── vercel.json
├── .gitignore
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── types.ts
│   ├── data/
│   │   └── seedRecipes.ts
│   └── lib/
│       ├── ingredients.ts
│       ├── ingredients.test.ts
│       ├── shopping-list.ts
│       └── storage.ts
└── dist/ / node_modules/
```

Wichtige Dateien:

- `src/App.tsx` → zentrale UI, Tabs, React-State, Benutzeraktionen und lokale Validierung
- `src/types.ts` → Domänentypen, Kategorien, Einheiten und Mahlzeittypen
- `src/lib/storage.ts` → `localStorage`-Adapter, Normalisierung und Migration älterer Daten
- `src/lib/ingredients.ts` → Zutaten-Normalisierung, Formatierung, Rundung und Zusammenführung
- `src/lib/shopping-list.ts` → Erzeugung und Gruppierung der Einkaufsliste
- `src/data/seedRecipes.ts` → initiale Beispielrezepte
- `src/lib/ingredients.test.ts` → Tests für Zutaten- und Einkaufslogik
- `src/styles.css` → visuelle Gestaltung und responsive Regeln
- `vercel.json` → HTTP-Sicherheitsheader für Vercel
- `.gitignore` → Ausschluss von `node_modules`, `dist`, TypeScript-Builddaten und Env-Dateien

## 5. Aktuelle Seiten und Funktionen

### Rezepte

Die Rezepte-Ansicht ist ein Tab innerhalb von `App.tsx`.

- Suche nach Rezeptname
- Filter nach Kategorie
- Rezeptkarten mit Name, Kategorie, Zutatenanzahl und Standardportionen
- Bilddarstellung oder farbige Initiale, wenn kein Bild vorhanden ist
- Rezept auswählen und direkt dem Plan hinzufügen oder daraus entfernen
- Rezept bearbeiten
- neues Rezept über den Plus-Button anlegen

Die aktuell gültigen Rezeptkategorien sind `Vegetarisch`, `Fleisch`, `Vegan`, `Fisch` und `Sonstiges`.

### Rezept erstellen / bearbeiten

Der Rezepteditor wird als Modal dargestellt.

- Rezeptname
- Kategorie
- Portionen
- Bild
- Zutatenliste
- Zutatenmenge
- Einheit
- Einkaufskategorie
- einzelne Zutaten entfernen
- Rezept speichern
- vorhandenes Rezept löschen

Zutaten werden aus einer Liste häufiger Zutaten ausgewählt. Freie Texteingabe für neue Zutaten ist im aktuellen Editor nicht vorgesehen; die Vorschläge stammen aus `commonIngredients` in `App.tsx`.

Die Bildauswahl akzeptiert JPEG, PNG und WebP. Die Datei darf höchstens 2 MB groß sein, maximal 4096 Pixel breit oder hoch sein und muss erfolgreich als Bild dekodiert werden. Das Bild wird anschließend als Data-URL im Rezept gespeichert.

### Planer

Der Planer ist die Startansicht und gruppiert Einträge nach:

- Frühstück
- Mittagessen
- Nachtessen
- Snacks
- Sonstiges

Vorhandene Funktionen:

- Rezept zu einer Mahlzeit hinzufügen
- mehrere Rezepte im Rezeptpicker auswählen
- einzelne Lebensmittel ohne eigenes Rezept hinzufügen
- Portionen eines geplanten Rezepts mit Minus/Plus ändern
- Menge und Einheit einzelner Lebensmittel ändern
- Einträge aus dem Plan entfernen
- zur automatisch erzeugten Einkaufsliste wechseln

Es gibt aktuell keine Datumsnavigation, keine Wochentage und keine Speicherung eines konkreten Wochenzeitraums. Der Name `WeeklyPlan` bezeichnet nur das Datenobjekt, nicht eine implementierte Wochenansicht.

### Einkauf

Die Einkaufsliste wird aus den aktuellen Planer-Einträgen berechnet.

- Gruppierung nach Einkaufskategorie
- offene Positionen zählen
- Positionen abhaken
- Positionen aus der aktuellen Ansicht entfernen
- Mengen formatiert anzeigen
- leerer Zustand, wenn nichts geplant ist

Das Löschen aus der Ansicht ist lokal in `hiddenShoppingIds` und wird nicht dauerhaft als eigene Storage-Struktur gespeichert. Bei einer Neuberechnung kann ein ausgeblendeter Eintrag wieder sichtbar werden.

## 6. Datenmodell

Die Typen stammen aus `src/types.ts`.

### `Ingredient`

| Feld | Typ | Zweck |
|---|---|---|
| `id` | `string` | Identifikation der Zutat |
| `name` | `string` | Anzeigename |
| `normalizedName` | `string` | Normalisierte Form für Vergleiche |
| `quantity` | `number` | Menge |
| `unit` | `string` | Einheit, z. B. `g`, `ml` oder `Stück` |
| `category` | `GroceryCategory` | Einkaufskategorie |

### `Recipe`

| Feld | Typ | Zweck |
|---|---|---|
| `id` | `string` | Identifikation des Rezepts |
| `name` | `string` | Rezeptname |
| `category` | `string` | Rezeptkategorie; beim Laden auf aktuelle Kategorien normalisiert |
| `servings` | `number \| undefined` | ursprüngliche Rezeptportionen; Standardwert 4 |
| `imageUrl` | `string \| undefined` | lokale Bild-Data-URL |
| `ingredients` | `Ingredient[]` | Zutaten des Rezepts |

### `PlannedRecipe`

| Feld | Typ | Zweck |
|---|---|---|
| `id` | `string` | Identifikation des Planer-Eintrags |
| `recipeId` | `string \| undefined` | Referenz auf ein Rezept, sofern es ein Rezept-Eintrag ist |
| `mealType` | `MealType` | Mahlzeitgruppe |
| `servings` | `number` | im Plan gewählte Portionen |
| `ingredient` | `Ingredient \| undefined` | direkte Lebensmittelposition ohne Rezept |

Ein Planer-Eintrag enthält entweder `recipeId` oder `ingredient`.

### `WeeklyPlan`

| Feld | Typ | Zweck |
|---|---|---|
| `mealSlots` | `PlannedRecipe[]` | aktuelle Planer-Einträge |
| `weekStart` | `string \| undefined` | im Typ vorgesehen, aktuell nicht genutzt |
| `selectedRecipeIds` | `string[] \| undefined` | Legacy-Feld für ältere gespeicherte Pläne |

### `ShoppingItem`

| Feld | Typ | Zweck |
|---|---|---|
| `id` | `string` | zusammengesetzte Identifikation aus Zutat und Einheit |
| `name` | `string` | Anzeigename |
| `quantity` | `number` | zusammengefasste Einkaufsmenge |
| `unit` | `string` | Einheit |
| `category` | `GroceryCategory` | Gruppierung in der Einkaufsliste |
| `checked` | `boolean` | abgehakt oder offen |

Weitere Konstanten in `types.ts` definieren die gültigen Einkaufs-, Rezept- und Mahlzeitkategorien sowie Einheiten.

## 7. Geschäftslogik

### Portionen

Ein Rezept hat ursprüngliche Portionen (`recipe.servings`, Standardwert 4). Ein Planer-Rezept hat die aktuell gewählten Portionen (`planned.servings`).

Für Rezeptzutaten wird der Faktor berechnet als:

```text
Faktor = gewählte Portionen / ursprüngliche Rezeptportionen
Einkaufsmenge = Rezeptmenge × Faktor
```

Die Planer-Portionen werden mindestens auf 1 begrenzt. Beim Speichern eines Rezepts werden Portionen auf ganze Zahlen abgerundet.

### Einkauf

`generateShoppingList()` in `src/lib/shopping-list.ts`:

1. verarbeitet alle geplanten Rezept- und Lebensmittel-Einträge
2. sucht für Rezept-Einträge das referenzierte Rezept
3. skaliert Rezeptzutaten anhand des Portionsfaktors
4. rundet skalierte Mengen
5. führt gleiche Zutaten zusammen
6. übernimmt den Abhakstatus gespeicherter Einkaufspositionen

Rundung in `roundShoppingQuantity()`:

- Gramm: auf 25-g-Schritte
- `kg`, `l`, `ml`, `Stück`, `Packung`, `Dose`, `Bund`: auf ganze Werte, mindestens 1
- andere Einheiten: auf eine Nachkommastelle
- ungültige oder nicht positive Werte: `0`

### Zutaten zusammenfassen

`mergeIngredients()` bildet den Schlüssel:

```text
normalisierter Zutatenname + "|" + kleingeschriebene Einheit
```

Nur Zutaten mit gleichem normalisiertem Namen und gleicher Einheit werden zusammengeführt. Unterschiedliche Einheiten bleiben getrennt.

`normalizeIngredientName()` entfernt äußere Leerzeichen, vereinheitlicht Leerraum, konvertiert in deutsche Kleinschreibung und kennt einige Plural-Aliase, z. B. `Äpfel` → `apfel` und `Bananen` → `banane`.

Der Anzeigename der zusammengeführten Position stammt vom ersten gefundenen Eintrag.

### Einzelne Lebensmittel

Einzelne Lebensmittel werden im Planer als `PlannedRecipe` mit `ingredient` statt `recipeId` gespeichert. Sie enthalten Name, Menge, Einheit und Einkaufskategorie.

Sie werden ohne Portionsskalierung in die Einkaufsliste übernommen und anschließend gemeinsam mit Rezeptzutaten normalisiert und zusammengeführt.

### Persistenz und Migration

`src/lib/storage.ts` nutzt diese Schlüssel:

```text
sonntagskueche:recipes:v1
sonntagskueche:plan:v1
sonntagskueche:shopping:v1
```

Beim Laden werden gespeicherte Daten defensiv normalisiert. Ältere Rezeptkategorien wie `Familienliebling`, `Würzig`, `Schnell`, `Pasta`, `Frisch`, `Wochenende` und `One-Pot` werden auf aktuelle Kategorien abgebildet. Ältere Pläne mit `selectedRecipeIds` werden in `mealSlots` umgewandelt.

## 8. UI / UX Entscheidungen

- Mobile-first Oberfläche mit sicherem Abstand für iPhone-Notches und untere Navigation
- kompakte, persönliche Rezeptkarten statt komplexer Dashboard-Struktur
- drei Hauptbereiche über eine fixe untere Navigation: Planer, Rezepte, Einkauf
- Rezepteditor und Picker als Bottom-Sheet auf kleinen Bildschirmen
- Desktop-Anpassung ab ca. 680 Pixel mit zentriertem App-Container
- `DM Sans` für UI-Text und `Fraunces` für größere Überschriften und Initialen
- warmes Papier-/Creme-Design mit Grün als Hauptaktion und Orange als Akzent
- Kategorie-Filter als horizontal scrollbare Reihe
- Plus/Minus-Stepper für Portionen
- Mülleimer-Icons für das Entfernen von Einträgen
- Einkaufsliste nach Einkaufskategorien gruppiert
- leere Zustände für keine Treffer, leeren Plan und leere Einkaufsliste
- keine implementierte Wochen- oder Datumsnavigation

## 9. Deployment

Lokal:

```bash
npm install
npm run dev
```

Produktionsbuild:

```bash
npm run build
```

Das Build-Skript führt zuerst `tsc -b` und danach `vite build` aus. Vite erzeugt die statische Ausgabe in `dist/`.

Tests:

```bash
npm test
```

Vercel:

- Das Projekt ist für statisches Vite-Hosting geeignet.
- `vercel.json` definiert Security-Header für alle Pfade.
- Es sind aktuell keine Environment Variables im Anwendungscode vorgesehen.
- GitHub-Verbindung oder ein konkretes bestehendes Vercel-Projekt sind im Repository nicht dokumentiert.
- `dist/` und `node_modules/` sind laut `.gitignore` ausgeschlossen.

Die veröffentlichten Frontend-Dateien enthalten nur die App und Seed-Rezepte. Benutzerinhalte aus `localStorage` werden nicht an Vercel übertragen und nicht durch Vercel geteilt.

## 10. Sicherheit

- Keine Authentifizierung
- Keine Datenbank
- Keine API-Endpunkte
- Keine Supabase-Integration
- Keine RLS-Regeln oder Storage-Buckets
- Keine verwendeten Environment Variables
- Keine `VITE_`-Secrets oder Service-Role-Keys im Frontend
- React rendert Benutzereingaben als Text; im Anwendungscode wird kein `dangerouslySetInnerHTML` verwendet
- Rezeptbilder werden ausschließlich lokal als Data-URL gespeichert
- Upload-Limits: JPEG/PNG/WebP, maximal 2 MB, maximal 4096 Pixel je Dimension, erfolgreiche Bilddekodierung erforderlich
- Vercel-Header: CSP, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`

Die öffentliche URL macht die App-Oberfläche erreichbar. Sie macht die `localStorage`-Daten eines anderen Browsers nicht direkt lesbar. Ein Besucher kann jedoch den öffentlich ausgelieferten JavaScript-Code einsehen und eine eigene lokale App-Instanz verwenden.

## 11. Bereits getroffene wichtige Entscheidungen

- Vite/React/TypeScript als aktuelle Frontend-Basis
- Vercel als vorgesehener statischer Deployment-Ort
- lokale Speicherung ohne Backend für den aktuellen persönlichen Einsatz
- Rezeptportionen als Basis für die automatische Einkaufsberechnung
- Zutatenzusammenführung über normalisierten Namen und Einheit
- einzelne Lebensmittel können ohne eigenes Rezept geplant werden
- Planergruppen: Frühstück, Mittagessen, Nachtessen, Snacks und Sonstiges
- Rezeptbilder werden in Karten und Planerzeilen verwendet
- aktuelle Rezeptkategorien: Vegetarisch, Fleisch, Vegan, Fisch und Sonstiges
- keine Wochenansicht oder Datumsplanung im aktuellen Funktionsumfang

Diese Entscheidungen sollten nicht ohne Prüfung der Auswirkungen auf lokale Daten und Einkaufslogik geändert werden.

## 12. Bekannte Probleme / technische Schulden

- **Problem:** Daten werden nur im Browser-`localStorage` gespeichert.
  **Auswirkung:** Keine Synchronisation zwischen iPhone und PC; Browserdaten können gelöscht werden.
  **Status:** Aktuelles Architekturverhalten.
  **Priorität:** mittel

- **Problem:** Bilder werden als Base64-Data-URLs im Rezept gespeichert.
  **Auswirkung:** Relativ hoher `localStorage`-Verbrauch und begrenzte Skalierbarkeit.
  **Status:** Für lokale Einzelverwendung akzeptiert; kein Server-Upload vorhanden.
  **Priorität:** mittel

- **Problem:** Der Planer speichert aktuell keinen konkreten Zeitraum.
  **Auswirkung:** Keine echte Wochenhistorie oder Datumsnavigation.
  **Status:** Noch nicht implementiert.
  **Priorität:** niedrig bis mittel

- **Problem:** Ausgeblendete Einkaufspunkte werden nur in React-State gehalten.
  **Auswirkung:** Nach Neuladen oder Neuberechnung können sie wieder auftauchen.
  **Status:** Aktuelles Verhalten.
  **Priorität:** niedrig

- **Problem:** Im Arbeitsbaum existieren umfangreiche bestehende Löschungen unter `dist/` und `node_modules/`.
  **Auswirkung:** Git-Status und Deployment-Review können dadurch unübersichtlich sein.
  **Status:** Nicht durch diese Dokumentation geändert; vor Commit/Deployment separat prüfen.
  **Priorität:** hoch für Repository-Hygiene

## 13. Offene Punkte / Roadmap

### Als Nächstes

- Entscheidung treffen, ob lokale Speicherung für die Nutzung auf iPhone und PC ausreicht.
- Git-Status vor Deployment bereinigen und sicherstellen, dass keine generierten oder vertraulichen Dateien committed werden.
- Vercel-Projekt und GitHub-Verbindung bei Bedarf außerhalb des Codes einrichten und dokumentieren.
- Manuell auf einem iPhone und Desktop-Browser testen.

### Später

- Cloud-Synchronisation und Authentifizierung nur einführen, wenn gemeinsame Daten zwischen Geräten benötigt werden.
- Bei Cloud-Speicherung ein echtes Benutzer-/Datenmodell mit Zugriffsschutz definieren.
- Bilder bei Bedarf in einen geschützten Storage auslagern.
- Ausgeblendete Einkaufspunkte dauerhaft speichern, falls dieses Verhalten gewünscht ist.
- Wochen- oder Datumsplanung nur ergänzen, wenn sie fachlich benötigt wird.

### Ideen

Keine weiteren Funktionen sind aus dem aktuellen Code zwingend abzuleiten. Neue Ideen sollten zuerst gegen den persönlichen, einfachen Nutzungsschwerpunkt geprüft werden.

## 14. Regeln für zukünftige Änderungen

- Vor Änderungen zuerst `App.tsx`, `types.ts`, `storage.ts` und die betroffene Logik in `src/lib/` lesen.
- Bestehende Funktionen und lokale Datenmigration nicht ohne Grund entfernen.
- Keine neue Library einführen, wenn React, TypeScript und die vorhandenen Hilfsfunktionen ausreichen.
- Mobile Darstellung auf kleinen iPhone-Bildschirmen mit berücksichtigen.
- Datenmodelländerungen auf alte `localStorage`-Daten und Migration prüfen.
- Einkaufslogik nicht ändern, ohne Auswirkungen auf Portionen, Zutatenzusammenführung und Einzel-Lebensmittel zu prüfen.
- Keine Secrets, API-Keys oder privaten Daten committen.
- Keine `VITE_`-Variable für echte Geheimnisse verwenden; Frontend-Variablen sind öffentlich.
- Bei Uploadänderungen Dateityp, Dateigröße, Dimensionen und lokalen Speicherverbrauch berücksichtigen.
- Nach Codeänderungen mindestens ausführen:

```bash
npm run build
npm test
```

- Bei größeren Änderungen zuerst prüfen, ob Planer, Rezepte und Einkauf dieselben Daten gemeinsam verwenden.
- Anwendungscode und Dokumentation müssen den tatsächlichen Implementierungsstand beschreiben; geplante Features als offen markieren.

## 15. Aktueller Status

**Was funktioniert?**

Rezepte können gesucht, gefiltert, erstellt, bearbeitet und gelöscht werden. Mahlzeiten und einzelne Lebensmittel können geplant werden. Portionen werden berücksichtigt und daraus wird eine gruppierte Einkaufsliste mit Rundungslogik erzeugt. Lokale Bild-Uploads und responsive Darstellung sind vorhanden. Build und bestehende Vitest-Tests sind funktionsfähig.

**Was ist aktuell in Arbeit?**

Im Code ist aktuell keine konkrete Feature-Implementierung in Arbeit. Die Dokumentation beschreibt den bestehenden Stand.

**Was ist noch offen?**

Geräteübergreifende Synchronisation, Authentifizierung, Cloud-Speicherung, eine echte Wochen-/Datumsplanung und eine dauerhafte Behandlung ausgeblendeter Einkaufspunkte sind nicht implementiert. Vor Deployment muss außerdem der bestehende Git-Status geprüft werden.

**Was sollte ein neuer Agent als Erstes wissen?**

Dies ist derzeit eine lokale Single-User-SPA ohne Backend. Die zentrale fachliche Abhängigkeit ist: Planeränderungen erzeugen die Einkaufsliste, und Rezeptportionen beeinflussen deren Mengen. Änderungen an Datenmodell, Storage oder Einkaufslogik müssen deshalb gemeinsam betrachtet werden.

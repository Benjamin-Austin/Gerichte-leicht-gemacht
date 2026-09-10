# Sonntagsküche – Project Context

## 1. Projektübersicht

**Sonntagsküche** ist eine persönliche Rezept-, Mahlzeitenplan- und Einkaufsliste-App. Sie richtet sich aktuell an eine einzelne Person, die Rezepte verwalten, Mahlzeiten planen und daraus eine Einkaufsliste ableiten möchte.

Die App arbeitet clientseitig mit Supabase Authentication, PostgreSQL und privaten Storage-Buckets. Rezepte, Planer und Einkaufsliste werden benutzerbezogen synchronisiert.

Hauptfunktionen:

- Rezepte suchen, filtern, erstellen, bearbeiten und löschen
- Zutaten und Portionen pro Rezept verwalten
- Bilder zu Rezepten hinzufügen
- Rezepte bestimmten Mahlzeiten zuordnen
- einzelne Lebensmittel direkt in den Plan aufnehmen
- automatische Einkaufsliste aus dem aktuellen Plan erzeugen
- Einkaufspunkte abhaken oder aus der Ansicht entfernen
- Markdown-formatierte Zubereitung und optionale Zubereitungsbilder

## 2. Tech Stack

| Bereich | Technologie | Verwendung |
|---|---|---|
| Frontend | React 19 | UI und Komponentenstruktur |
| Sprache | TypeScript | Typen, State- und Geschäftslogik |
| Build Tool | Vite | Entwicklungsserver und Produktionsbuild |
| Styling | CSS in `src/styles.css` | Responsive, mobile-first Oberfläche |
| UI Icons | `lucide-react` | Icons für Navigation und Aktionen |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-sanitize` | Sichere Markdown-Darstellung der Zubereitung |
| Tests | Vitest | Tests für Zutaten- und Einkaufslogik |
| Persistenz | Supabase PostgreSQL und Storage | Rezepte, Plan, Einkaufsliste und private Bilder |
| Hosting-Konfiguration | Vercel-Konfiguration | Security-Header für statische Auslieferung |
| Datenbank | Supabase PostgreSQL | `recipes`, `ingredients`, `preparation_images`, `plan_slots`, `shopping_items` |
| Authentication | Supabase Auth | Email-/Passwort-Login |

Zusätzlich werden Google Fonts (`DM Sans` und `Fraunces`) in `src/styles.css` eingebunden.

## 3. Architektur

```text
Benutzer
  ↓
React-App (`src/App.tsx`)
  ├── Rezepte, Planer und Einkauf als Tabs
  ├── lokale State-Verwaltung mit React Hooks
  ├── Zutaten-/Einkaufslogik aus `src/lib/`
  ├── `src/lib/storage.ts`
  ├── `src/lib/supabase.ts`
  └── Supabase Auth / PostgreSQL / private Storage-Buckets
```

Die Anwendung läuft clientseitig und verwendet Supabase als Backend. Der Browser greift mit der öffentlichen Supabase-Konfiguration und RLS-geschützten Tabellen auf die eigenen Daten zu.

`App.tsx` hält den zentralen Anwendungszustand. Änderungen an Rezepten und Plan werden asynchron über `storage.ts` in Supabase gespeichert. Die Einkaufsliste wird weiterhin aus Rezepten und Planer-Einträgen berechnet; Status und ausgeblendete Positionen werden in `shopping_items` gespeichert.

Markdown bleibt als Text im Rezept gespeichert und wird erst beim Anzeigen im Frontend gerendert und sanitisiert. Private Bilder werden als Storage-Pfade gespeichert und für die Anzeige in kurzlebige signierte URLs umgewandelt.

Daten sind an den eingeloggten Supabase-Benutzer gebunden und können auf mehreren Geräten verwendet werden.

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
│   └── lib/
│       ├── ingredients.ts
│       ├── ingredients.test.ts
│       ├── markdown.tsx
│       ├── markdown.test.tsx
│       ├── urls.ts
│       ├── uploads.ts
│       ├── shopping-list.ts
│       └── storage.ts
└── dist/ / node_modules/
```

Wichtige Dateien:

- `src/App.tsx` → zentrale UI, Tabs, React-State, Benutzeraktionen und lokale Validierung
- `src/types.ts` → Domänentypen, Kategorien, Einheiten und Mahlzeittypen
- `src/lib/storage.ts` → Supabase-Adapter, relationale Mappings, signierte Bild-URLs und Normalisierung
- `src/lib/ingredients.ts` → Zutaten-Normalisierung, Formatierung, Rundung und Zusammenführung
- `src/lib/markdown.tsx` → sichere Markdown-Darstellung für Benutzereingaben; HTML und eingebettete Bilder werden nicht als aktive Inhalte zugelassen
- `src/lib/urls.ts` → erlaubt nur `http`- und `https`-URLs
- `src/lib/uploads.ts` → gemeinsame MIME-, Größen- und Bilddekodierungsprüfung
- `src/lib/shopping-list.ts` → Erzeugung und Gruppierung der Einkaufsliste
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
- Zubereitungsschritte als Markdown-Text
- optionale Bilder zu Zubereitungsschritten
- einzelne Zutaten entfernen
- Rezept speichern
- vorhandenes Rezept löschen

Zutaten werden aus dem zentralen Katalog ausgewählt. Eigene Zutaten können im Rezepteditor angelegt, kategorisiert und lokal im Browser wiederverwendet werden.

Die Bildauswahl akzeptiert JPEG, PNG und WebP. Rezept- und Zubereitungsbilder werden in privaten Supabase-Buckets gespeichert; im Rezept bleiben Storage-Pfade, für die Anzeige signierte URLs. Zubereitungsbilder können mehreren Textpositionen zugeordnet, verschoben und gelöscht werden.

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
| `imagePath` | `string \| undefined` | persistenter Pfad im privaten Cover-Bucket |
| `imageUrl` | `string \| undefined` | kurzlebige signierte Anzeige-URL |
| `preparation` | `string \| undefined` | formatierter Zubereitungstext mit erhaltenen Zeilenumbrüchen |
| `preparationImages` | `PreparationImage[] \| undefined` | optionale Bilder mit Schrittposition |
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
sonntagskueche:ingredient-catalog:v1
```

Beim Laden werden gespeicherte Daten defensiv normalisiert. Ältere Rezeptkategorien wie `Familienliebling`, `Würzig`, `Schnell`, `Pasta`, `Frisch`, `Wochenende` und `One-Pot` werden auf aktuelle Kategorien abgebildet. Ältere Pläne mit `selectedRecipeIds` werden in `mealSlots` umgewandelt.

Ältere Zubereitungs-Arrays werden beim Laden mit Zeilenumbrüchen in den aktuellen Markdown-Text migriert. Eigene Zutaten werden separat im lokalen Katalog gespeichert und bei der Suche mit dem Standardkatalog zusammengeführt.

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

Aktueller Teststand: 2 Testdateien mit insgesamt 17 bestandenen Tests. Ein `lint`-Script ist derzeit nicht eingerichtet; `npm run lint` kann deshalb nicht ausgeführt werden.

Security- und Installationschecks vor dem Deployment:

```bash
npm audit --audit-level=moderate
npm ci --dry-run
git diff --check
```

Der aktuelle Audit meldet 0 Schwachstellen. `npm ci --dry-run` ist erfolgreich und bestätigt, dass `package.json` und `package-lock.json` synchron sind.

Vercel:

- Das Projekt ist für statisches Vite-Hosting geeignet.
- `vercel.json` definiert Security-Header für alle Pfade.
- Supabase wird über die öffentlichen Vite-Variablen `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` konfiguriert. Alternativ unterstützt die App `VITE_SUPABASE_ANON_KEY`.
- Beide Variablen müssen in Vercel unter **Project Settings > Environment Variables** für **Production** gesetzt werden. Für Preview-Deployments müssen sie zusätzlich für **Preview** gesetzt werden.
- Nach dem Anlegen oder Ändern der Variablen ist ein neuer Deployment-Build erforderlich, weil Vite `VITE_*`-Variablen beim Build in das Frontend einbettet.
- GitHub-Verbindung oder ein konkretes bestehendes Vercel-Projekt sind im Repository nicht dokumentiert.
- `dist/` und `node_modules/` sind laut `.gitignore` ausgeschlossen.

Die veröffentlichten Frontend-Dateien enthalten die App; Benutzerinhalte werden ausschließlich über Supabase und RLS-geschützte Tabellen geladen. Markdown wird im Frontend mit `react-markdown`, `remark-gfm` und `rehype-sanitize` verarbeitet; `rehype-raw` wird nicht verwendet.

### Vercel-Checkliste

1. Framework-Preset: Vite.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Diese Environment Variables setzen:

  ```text
  VITE_SUPABASE_URL=https://<projekt-id>.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=<öffentlicher-publishable-key>
  ```

5. Die Variablen mindestens für **Production**, bei Preview-Deployments auch für **Preview**, aktivieren.
6. Nach Änderungen **Redeploy** ausführen. Fehlen die Variablen beim Build, wirft `src/lib/supabase.ts` absichtlich einen Konfigurationsfehler, bevor die React-Oberfläche gerendert wird.
7. Keine vertraulichen Daten oder Service-Role-Keys mit `VITE_` oder `NEXT_PUBLIC_` prefixen. Diese Variablen werden in das öffentliche JavaScript eingebaut; der Publishable-Key ist dagegen für den Client vorgesehen.
8. HTTPS, Custom Domain und die Header aus `vercel.json` vor dem ersten Production-Deployment prüfen. Die CSP erlaubt Supabase-API-Verbindungen sowie signierte Bilder über `https://*.supabase.co` und Realtime über `wss://*.supabase.co`.

Es gibt aktuell keine öffentlich erreichbaren Funktionen, für die serverseitiges Rate Limiting, Authorization, CSRF-Schutz, RLS oder Datenbank-Credentials erforderlich wären. Diese Aussage gilt nicht automatisch nach einer späteren Einführung von Login, Cloud-Synchronisation oder externen APIs.

## 10. Sicherheit

- Supabase-Authentifizierung über Email und Passwort
- Supabase-Datenbank mit RLS-geschützten Tabellen
- Keine API-Endpunkte
- Supabase-Integration mit privaten Storage-Buckets
- Zugriffsschutz wird durch Supabase-RLS und Benutzerfilter vorausgesetzt
- Öffentliche Supabase-Environment Variables werden verwendet; Service-Role-Keys niemals im Frontend
- Keine `VITE_`-Secrets oder Service-Role-Keys im Frontend
- Markdown wird über `react-markdown` und `rehype-sanitize` gerendert; HTML, Skripte, Eventattribute und eingebettete Bilder werden nicht als aktive Inhalte zugelassen
- Markdown- und Videolinks werden auf `http:` und `https:` begrenzt
- Rezeptbilder werden als Pfade in privaten Buckets gespeichert und über signierte URLs angezeigt
- Upload-Limits: JPEG/PNG/WebP, maximal 2 MB, maximal 4096 Pixel je Dimension, erfolgreiche Bilddekodierung erforderlich
- Vercel-Header: CSP, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`

### Sicherheitsbericht vor Deployment

| Status | Problem | Risiko | Lösung | Status |
|---|---|---|---|---|
| 🟢 | Keine API, Datenbank, Authentifizierung oder Benutzerkonten | Keine serverseitige Angriffsfläche in diesem Projekt | Keine zusätzliche Maßnahme für die aktuelle Architektur | Geprüft |
| 🟢 | Keine gefundenen Secrets oder Environment-Variablen im Frontend | Keine aktuell sichtbaren Zugangsdaten | `.env`-Dateien sind ignoriert; Git- und Textsuche geprüft | Geprüft |
| 🟢 | Markdown kann Benutzereingaben enthalten | Unsanitisiertes HTML könnte XSS auslösen | Sanitization, `skipHtml`, restriktive Link-/Bildregeln und Regressionstests | Behoben |
| 🟢 | Supabase-Persistenz | Zugriff und RLS-Konfiguration müssen korrekt gepflegt werden | Tabellen- und Storage-RLS pro Benutzer prüfen | Offen vor Deployment |
| 🟢 | Private Bild-Buckets | Direkte öffentliche URLs wären ungewollt zugänglich | Storage-Pfade speichern und signierte URLs erzeugen | Umgesetzt |
| 🟡 | Keine serverseitige Rate-Limit-/Authorization-Schicht | Bei späterem Backend wären Frontend-Prüfungen nicht ausreichend | Vor Cloud-/Login-Funktionen serverseitige Zugriffskontrollen einführen | Nicht relevant im aktuellen Scope |
| 🟡 | Kein Lint-Script | Stil- und bestimmte statische Fehler werden nicht durch einen eigenen Lint-Schritt geprüft | Vor größerem Ausbau ESLint/TypeScript-Linting ergänzen | Offen, kein unmittelbares Security-Problem |

**Kann ich die App in ihrem aktuellen Zustand öffentlich auf Vercel deployen: JA, sofern Supabase-RLS und Storage-Policies geprüft sind.** Build und Tests sind erfolgreich. Ein eigenes Lint-Script fehlt weiterhin.

Die öffentliche URL macht die App-Oberfläche erreichbar. Datenzugriff und private Bilder müssen durch Supabase-RLS und Storage-Policies auf den eingeloggten Benutzer begrenzt sein.

## 11. Bereits getroffene wichtige Entscheidungen

- Vite/React/TypeScript als aktuelle Frontend-Basis
- Vercel als vorgesehener statischer Deployment-Ort
- Supabase Auth, PostgreSQL und private Storage-Buckets als Backend
- Rezeptportionen als Basis für die automatische Einkaufsberechnung
- Zutatenzusammenführung über normalisierten Namen und Einheit
- einzelne Lebensmittel können ohne eigenes Rezept geplant werden
- Planergruppen: Frühstück, Mittagessen, Nachtessen, Snacks und Sonstiges
- Rezeptbilder werden in Karten und Planerzeilen verwendet
- aktuelle Rezeptkategorien: Vegetarisch, Fleisch, Vegan, Fisch und Sonstiges
- keine Wochenansicht oder Datumsplanung im aktuellen Funktionsumfang

Diese Entscheidungen sollten nicht ohne Prüfung der Auswirkungen auf lokale Daten und Einkaufslogik geändert werden.

## 12. Bekannte Probleme / technische Schulden

- **Prüfpunkt:** Supabase-RLS und Storage-Policies müssen pro Benutzer korrekt konfiguriert sein.
  **Auswirkung:** Fehlende Policies könnten Datenzugriff oder Uploads blockieren beziehungsweise zu weit öffnen.
  **Status:** Vor Deployment im Supabase-Projekt prüfen.
  **Priorität:** mittel

- **Problem:** Signierte Bild-URLs laufen nach einer Stunde ab.
  **Auswirkung:** Bereits geladene Datensätze benötigen beim erneuten Laden neue URLs.
  **Status:** Beim Laden werden URLs neu signiert.
  **Priorität:** niedrig

- **Problem:** Der Planer speichert aktuell keinen konkreten Zeitraum.
  **Auswirkung:** Keine echte Wochenhistorie oder Datumsnavigation.
  **Status:** Noch nicht implementiert.
  **Priorität:** niedrig bis mittel

- **Problem:** Ausgeblendete Einkaufspunkte werden nur in React-State gehalten.
  **Auswirkung:** Nach Neuladen oder Neuberechnung können sie wieder auftauchen.
  **Status:** Aktuelles Verhalten.
  **Priorität:** niedrig

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
- Datenmodelländerungen auf bestehende Supabase-Daten und Migration prüfen.
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

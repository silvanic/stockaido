# Plan — Gestion de recettes

> Statut : proposition à review, rien n'est encore implémenté.

## Périmètre (volontairement simple)

Idée de départ : réutiliser la liste des noms d'aliments déjà connus (inventaire + catalogue) pour
ajouter facilement des ingrédients à une recette, une liste d'étapes, et un champ libre pour des
notes en fin de fiche. Pas de lien fort avec l'inventaire (pas de décrément de stock, pas d'unité
structurée) — on reste sur du texte libre pour rester simple à l'usage.

## 1. Modèle de données

```ts
// src/app/models/recipe.model.ts
export interface RecipeIngredient {
  name: string;        // texte libre, autocomplété depuis les aliments existants
  quantity?: string;   // texte libre aussi (ex. "2", "1 pincée") — pas de lien avec Unit
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  steps: string[];      // une étape = une chaîne, ordre = ordre du tableau
  notes?: string;       // champ libre en fin de fiche
  createdAt: number;
}

export type CreateRecipeDTO = Omit<Recipe, 'id' | 'createdAt'>;
```

## 2. Stockage : DB IndexedDB dédiée

`RecipeRepository` (src/app/repositories/) ouvre sa **propre** base `StockaidoRecipes` — pas la DB
`Stockaido` partagée avec `foods`/`barcodeCache`, pour éviter le piège déjà rencontré sur ce projet
(2 repositories ouvrant la même DB en parallèle qui ne créent qu'un seul des stores lors de
l'upgrade, cf. fix du 02/09/2026). CRUD calqué sur `ShoppingListRepository` : `addRecipe`,
`updateRecipe`, `deleteRecipe`, `getAllRecipes`.

## 3. Service

`RecipeService` (signals), même pattern que `ShoppingListService`/`LocationService` : `recipes$`
(signal en lecture seule), CRUD, pas de logique métier complexe.

## 4. Autocomplétion des ingrédients — réutilisation de l'existant

Le champ d'ajout d'ingrédient réutilise la même logique que `AddFoodModalComponent.onNameInput()` :
filtre `FoodService.foods$()` par nom, complété par `FoodCatalogService` (catalogue de 263
aliments FR/EN) pour les aliments pas encore en stock. Pas de nouveau service à créer, juste la
même approche de suggestions déjà en place ailleurs dans l'app.

### Indicateur "ingrédient manquant" (décidé : oui)

En vue lecture d'une recette, chaque ingrédient est comparé au stock actuel
(`FoodService.foods$()`) via une correspondance de nom normalisé (`normalizeForSearch`, déjà
utilisé pour la recherche) : si aucun aliment en stock ne correspond, un badge/icône "manquant"
s'affiche à côté de l'ingrédient. Volontairement une simple correspondance de nom (pas de
quantité comparée) — pas de décrément de stock, juste un repère visuel pour préparer ses courses
avant de cuisiner.

**Décidé : correspondance stricte** (nom normalisé identique, pas de correspondance partielle) —
l'autocomplétion à la saisie de l'ingrédient garantit déjà que son nom correspond exactement à un
aliment connu (inventaire ou catalogue), donc une correspondance stricte suffit et évite les
risques d'interprétation erronée d'une correspondance partielle.

## 5. UI

- **Nouvelle page** `RecipesPage` : liste des recettes (carte simple nom + nombre d'ingrédients),
  clic → ouverture en édition.
- **Modale** `RecipeModalComponent` (ajout/édition), structure du formulaire :
  1. Nom de la recette
  2. Ingrédients : champ avec autocomplete (comme add-food-modal) + bouton "Ajouter" → item dans
     une liste, supprimable individuellement
  3. Étapes : champ texte répété, bouton "Ajouter une étape", réorganisables par glisser-déposer
     (`ion-reorder` + `ion-reorder-group`, pattern natif Ionic, pas de librairie supplémentaire)
  4. Notes : `ion-textarea` libre en bas de formulaire

## 6. Navigation

Nécessite une 2e section de niveau égal à l'inventaire actuel → bascule vers une navigation par
onglets (`ion-tabs` + `ion-tab-bar slot="bottom"`, 2 onglets : Inventaire / Recettes), en
remplacement de la route unique actuelle (`app-routing.module.ts`). Le bouton d'ajout en footer
sticky (déjà en place pour l'inventaire, cf. décision UX du 20/08/2026) reste par onglet plutôt que
de devenir un bouton flottant (FAB) unique global : le libellé texte reste explicite selon le
contexte ("Ajouter un aliment" / "Ajouter une recette"), ce qui est plus accessible qu'une icône
seule dont le comportement changerait selon l'onglet actif.

## 7. Export/import — distinct du backup principal (décidé)

Les recettes ne rejoignent PAS l'export/import existant (`DataTransferService`, qui gère
foods+locations+units et est un remplacement complet, pas une fusion). Nouveau mécanisme séparé :
`exportRecipesToJson()`/`importRecipesFromJson()` (même service ou un `RecipeTransferService`
dédié), fichier JSON distinct (ex. `stockaido-recettes-<date>.json`). Les 2 exports restent
indépendants : importer un backup de stock ne touche pas aux recettes et vice-versa.

**Décidé : bouton dans le menu Options**, à côté du backup principal existant (pas dans
`RecipesPage`) — moins coûteux en UI/UX, cohérent avec le fait que "Sauvegarde des données" est
déjà centralisée dans Options plutôt que dispersée par fonctionnalité.

## 8. i18n

Nouveau bloc `recipesModal.*` + `recipes.*` (fr.json/en.json), même convention que le reste des
clés de l'app.

## Statut

Toutes les questions ouvertes ont été tranchées en review (correspondance stricte pour
l'indicateur "manquant", export/import dans le menu Options). Le plan est prêt pour
l'implémentation.

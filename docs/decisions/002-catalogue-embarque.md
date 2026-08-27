# 002 — Catalogue d'aliments statique embarqué

| | |
| --- | --- |
| **Statut** | ✅ Implémentée |
| **Date** | 20/08/2026 |
| **Périmètre** | 100 % offline, 263 aliments FR/EN |

## Problème résolu

L'autocomplétion du champ « nom » dans `AddFoodModalComponent` (`onNameInput()`) ne propose
aujourd'hui que les aliments déjà présents dans `foodService.foods$()`. Au premier lancement,
l'inventaire est vide : aucune suggestion. C'est le problème classique du *cold start*.

Un catalogue de référence le résout, et permet en bonus de pré-remplir l'unité, le lieu de
stockage typique et l'emoji lors de la sélection d'une suggestion.

## Structure de fichiers

```
src/assets/catalog/
  catalog.json      # métadonnées à clés stables : { id, unit, location }
  names.fr.json     # { "milk": "Lait", "egg": "Œufs" }
  names.en.json     # { "milk": "Milk", "egg": "Eggs" }
```

L'identifiant stable évite de dupliquer les métadonnées pour chaque langue. `catalog.json` est
chargé une fois et mis en cache ; seul le fichier de noms est rechargé lorsque `LanguageService`
change de locale.

> ⚠️ Les trois fichiers doivent contenir **exactement les mêmes identifiants**. Une entrée sans
> libellé dans la langue active est silencieusement ignorée au chargement.

## Implémentation réalisée

- `src/app/models/food-catalog.model.ts` — `CatalogMetadata`, `CatalogFile`, `CatalogEntry`
  (métadonnées + `name` + `searchKey` normalisée) et `NameSuggestion` (type union affiché dans la
  liste, avec un booléen `fromCatalog` distinguant les deux origines).
- `src/app/shared/text-normalization.ts` — `normalizeForSearch()` : minuscules, ligatures
  `œ`/`æ` décomposées, `NFD` + suppression des diacritiques, espaces compressés. Permet à
  « oeuf » de correspondre à « Œufs » et à « creme » de correspondre à « Crème ».
- `src/app/services/food-catalog.service.ts` — `FoodCatalogService` (signals) : charge le
  catalogue, se réabonne à `translate.onLangChange`, expose `search(query, limit, excludedKeys)`.
  Les entrées dont le libellé **commence** par la requête sont remontées en premier. En cas
  d'erreur de chargement, le service se dégrade silencieusement (liste vide) : le catalogue est un
  confort, son absence ne doit jamais bloquer la saisie.
- Initialisé dans `AppComponent`, à côté de `LanguageService.init()`.
- `AddFoodModalComponent.onNameInput()` — fusionne les deux sources : les aliments de
  l'utilisateur d'abord (plus pertinents, porteurs de son historique), puis le catalogue pour
  compléter, sans doublon. Plafond de 6 suggestions conservé.
- `selectSuggestion()` — une entrée catalogue pré-remplit le nom, l'unité et le lieu suggéré ;
  une entrée de l'inventaire reprend le nom, l'unité et le pas d'incrémentation. Aucun
  pré-remplissage en mode édition.
- Template : `ion-note` « Catalogue » en `slot="end"` pour distinguer visuellement l'origine
  (clé i18n `foodModal.fromCatalog`).
- `duplicateLocationNames` continue de ne comparer que sur `foods$()` : une entrée de catalogue
  n'est pas un doublon.

## Visuel des aliments : image personnalisée uniquement

Une piste « emoji par défaut issu du catalogue » a été implémentée puis **retirée** (20/08/2026) :
elle faisait doublon avec l'image personnalisée déjà en place, ajoutait un champ `Food.emoji` à
maintenir et alourdissait le catalogue de ~5 Ko.

Le visuel d'un aliment est donc : l'image personnalisée (`imageUrl`) si elle existe, sinon
l'icône générique.

## Contenu du catalogue

263 aliments courants répartis en fruits, légumes, herbes, produits laitiers et œufs, viandes,
poissons et fruits de mer, féculents et boulangerie, épicerie, fruits secs, épices, boissons,
surgelés et produits préparés. Chaque entrée porte une unité et un lieu de rangement typiques.

Les unités utilisées proviennent exclusivement de l'énumération `Unit`, et les lieux des valeurs
`StorageLocation` intégrées — sans quoi la valeur pré-remplie n'existerait pas dans les listes
déroulantes du formulaire.

## Dimensionnement

Les trois fichiers pèsent ~40 Ko au total (16,6 Ko pour `catalog.json`), servis comme assets
statiques et mis en cache par le Service Worker. Au-delà de quelques milliers d'entrées, passer en
chargement paresseux.

## Vérification de cohérence

Contrôle de la parité des identifiants entre les trois fichiers :

```powershell
$c = (Get-Content src/assets/catalog/catalog.json -Raw | ConvertFrom-Json).entries.id
$fr = (Get-Content src/assets/catalog/names.fr.json -Raw | ConvertFrom-Json).PSObject.Properties.Name
$en = (Get-Content src/assets/catalog/names.en.json -Raw | ConvertFrom-Json).PSObject.Properties.Name
Compare-Object $c $fr; Compare-Object $c $en
```

## Pistes d'amélioration

- Ajouter des synonymes de recherche par entrée (`aliases`) pour rattraper les dénominations
  régionales (« pomme de terre » / « patate »).
- Pondérer le classement par fréquence d'usage réelle de l'utilisateur.

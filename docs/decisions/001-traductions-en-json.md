# 001 — Les traductions restent dans des fichiers JSON

| | |
| --- | --- |
| **Statut** | ✅ Actée et appliquée |
| **Date** | 20/08/2026 |

Les traductions restent dans `src/assets/i18n/*.json`, chargées par `@ngx-translate` via
`TranslateHttpLoader`. Elles **ne seront pas stockées en base de données**.

## Justification

| Aspect | JSON dans `assets` | Base de données |
| --- | --- | --- |
| Disponibilité offline | Native | À gérer (cache, sync, fallback) |
| Versionnement Git / diff / revue | Oui | Non (données opaques) |
| Détection de clés manquantes | Possible au build | Runtime uniquement |
| Performance au démarrage | Fichier statique mis en cache par le Service Worker | Requête + parsing + cache manuel |
| Coût d'infrastructure | Nul | Hébergement + maintenance |

Le format JSON est par ailleurs le standard attendu par les plateformes de traduction
collaboratives (Weblate, Crowdin, Lokalise, Tolgee). Si le besoin d'internationalisation
grandit, c'est **là** qu'il faut investir — pas dans un changement de support de stockage.

## Distinction structurante à conserver

- **Texte d'interface** (`home.title`, `foodModal.name`, `units.piece`) → fichiers JSON,
  figés, versionnés avec le code.
- **Données utilisateur** (lieux et unités personnalisés) → IndexedDB, **non traduites**.
  Un lieu nommé « Cellier » doit rester « Cellier » quelle que soit la langue active.

## Point d'attention connu

Le pipe `| translate` est appliqué aux noms de lieux et d'unités personnalisés. Une clé
introuvable est renvoyée telle quelle, donc le comportement est correct — mais un utilisateur
qui nommerait un lieu `home.title` verrait s'afficher le titre de l'application. Cas marginal,
neutralisable en préfixant les clés intégrées ou en distinguant explicitement les libellés
intégrés des libellés personnalisés.

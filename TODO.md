# StockIonic — Suivi des versions

Liste de suivi des tâches, organisée par version. Les décisions d'architecture et leur
justification vivent dans [ROADMAP.md](ROADMAP.md) ; ce fichier ne suit que **l'avancement**.

Convention : `- [ ]` à faire, `- [x]` terminé. Une version est close quand toutes ses cases
sont cochées et qu'elle est déployée.

---

## v1.0.0 — Socle fonctionnel ✅ *déployée le 20/08/2026*

- [x] CRUD des aliments, quantités avec pas personnalisable
- [x] Lieux de rangement par défaut + personnalisés
- [x] Unités par défaut + personnalisées
- [x] Favoris, stock minimal, notes, image personnalisée
- [x] Recherche temps réel (nom et lieu)
- [x] Liste « À acheter » générée depuis les stocks minimaux
- [x] Persistance IndexedDB (aliments, lieux, unités)
- [x] Export / import JSON de toutes les données
- [x] Internationalisation FR/EN avec persistance du choix
- [x] Catalogue de 263 aliments pour l'autocomplétion (FR/EN)
- [x] Bouton « Ajouter » en footer collant + recherche dans l'en-tête
- [x] Séparateurs de section opaques et lisibles au défilement
- [x] Contrastes WCAG AA validés sur 9 écrans, 2 thèmes

**Limite assumée à ce stade :** l'application nécessite une connexion pour démarrer.

---

## v1.1 — PWA et fiabilité ✅ *prête à déployer*

Objectif : tenir la promesse « offline d'abord » côté web.

- [x] `ng add @angular/pwa` — service worker, manifeste, icônes
- [x] Passer `assets/i18n/*.json` et `assets/catalog/*.json` en stratégie `prefetch` dans
      `ngsw-config.json` *(sans ça l'offline reste cassé malgré le service worker)*
- [x] Vérifier le démarrage réel hors ligne (onglet Network → Offline, puis rechargement)
- [x] Vérifier les en-têtes de cache Netlify sur `index.html` *(risque : utilisateurs bloqués
      sur une version obsolète)* — `netlify.toml` ajouté
- [x] Réparer `app.component.spec.ts` — échoue sur `NG0201: No provider found for TranslateStore`
- [x] Corriger l'affirmation « Application installable en PWA » dans FEATURES.md une fois vrai
- [x] Tester le parcours export → import de bout en bout *(import validé dans le navigateur ;
      export couvert par `data-transfer.service.spec.ts` — le téléchargement lui-même n'est pas
      automatisable dans le navigateur intégré, à confirmer une fois dans un vrai navigateur)*
- [x] Ajouter une invite de mise à jour (`SwUpdate.versionUpdates`) *(sinon la nouvelle version
      n'apparaît qu'au second lancement)*

---

## v1.2 — Retours des premiers utilisateurs 📋 *à remplir*

À alimenter avec les remontées de la bêta.

- [ ] *(en attente de retours)*

---

## v2.0 — Catalogue collaboratif *(conditionnel)*

À n'engager que si l'application a une base d'utilisateurs réelle. Conception détaillée dans
[ROADMAP.md](ROADMAP.md#étape-2--catalogue-collaboratif-reporté).

- [ ] Opt-in explicite et réversible dans le panneau Options
- [ ] Endpoint de contribution (`name`, `unit`, `location`, `lang` uniquement)
- [ ] Table brute + job quotidien de normalisation (`pg_trgm`)
- [ ] Seuil de publication k-anonyme (N ≥ 5 contributeurs distincts)
- [ ] Statut de modération `pending / approved / rejected / merged`
- [ ] Export du snapshot JSON versionné sur CDN
- [ ] Politique de confidentialité + purge de la table brute à 30 jours

---

## Dette technique

- [ ] Couverture de tests quasi nulle : aucun test sur `FoodCatalogService`, le calcul de la
      liste à acheter *(l'import/export est désormais couvert)*
- [ ] Budgets SCSS dépassés sur `home.page.scss` et `add-food-modal.component.scss`
      *(alertes de build récurrentes — relever le seuil ou découper les styles)*
- [ ] Aucune validation sur un appareil physique, tout est vérifié en émulation navigateur
- [ ] Pas de télémétrie ni de remontée d'erreur : les bugs utilisateurs sont invisibles

---

## Idées non planifiées

- [ ] Dates de péremption avec alertes
- [ ] Codes-barres (le module `@capacitor/camera` est déjà installé)
- [ ] Langues supplémentaires (ES, DE, IT) — dupliquer `fr.json` et `names.fr.json`
- [ ] Historique des consommations
- [ ] Partage d'un inventaire entre plusieurs appareils *(implique un backend, cf. v2.0)*

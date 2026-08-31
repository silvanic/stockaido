# StockIonic — Inventaire des fonctionnalités

Application Ionic/Angular de gestion de stock alimentaire (frigo, congélateur, placard, lieux personnalisés), 100 % locale (IndexedDB), pensée mobile-first.

## 1. Gestion des aliments

- **Ajout d'un aliment** via une popin (`AddFoodModalComponent`) : nom, quantité, unité, lieu de rangement, notes, stock minimal, favori, image.
- **Autocomplétion du nom** : suggestions combinant les aliments déjà présents dans l'inventaire et un **catalogue de référence embarqué** de 263 aliments courants (FR/EN, `FoodCatalogService`), avec badge « Catalogue » pour distinguer l'origine. La sélection d'une suggestion du catalogue pré-remplit l'unité et le lieu de rangement typiques.
- **Modification** d'un aliment existant (même popin, mode édition).
- **Suppression** d'un aliment :
  - via swipe-to-delete sur la ligne (`ion-item-sliding`),
  - ou via le bouton « Supprimer » dans la popin d'édition (avec confirmation).
- **Quantité** :
  - boutons `+` / `−` pour incrémenter/décrémenter rapidement,
  - pas d'incrémentation personnalisable par aliment (`step`).
- **Unités de mesure** configurables par aliment (pièce, g, kg, ml, l, dl, cuillère à soupe/café, tasse, bouteille, paquet, boîte, pot, carton), et **unités personnalisées** créées librement par l'utilisateur.
- **Favoris** : marquage ★ d'un aliment, togglable directement depuis la liste.
- **Stock minimal** : seuil optionnel par aliment ; un badge « Stock bas » s'affiche quand la quantité passe sous ce seuil.
- **Dates de péremption et d'ouverture** : date de péremption imprimée sur l'emballage et date d'ouverture, avec un délai optionnel « à consommer sous X jours après ouverture » (l'échéance retenue est la plus proche des deux). Une icône s'affiche à côté du nom de l'aliment quand l'échéance est dépassée (rouge) ou proche, à J-3 (orange).
- **Notes libres** par aliment (champ texte optionnel).
- **Image personnalisée** :
  - possibilité d'importer une photo depuis l'appareil (au lieu de l'emoji générique),
  - redimensionnement automatique côté client (max 512 px) et compression JPEG avant stockage,
  - limite de poids du fichier source (8 Mo),
  - suppression de l'image possible (retour à l'icône par défaut).

## 2. Recherche

- Barre de recherche en temps réel, filtrant les aliments par **nom**, **lieu de rangement**, ou **statut de péremption** (les mots-clés « périmé »/« expired » et « bientôt »/« soon » remontent les aliments concernés, y compris ceux qui ne sont pas encore périmés mais proches de l'échéance).
- **Thème clair / sombre** : icône dans l'en-tête (à côté de « À acheter ») qui fait défiler Clair → Sombre → Système, avec persistance du choix. En mode « Système », le thème suit `prefers-color-scheme` de l'appareil.

## 3. Lieux de rangement

- Lieux prédéfinis : Frigo, Congélateur, Placard, Autre.
- **Lieux personnalisés** : création libre de nouveaux lieux de rangement (nom choisi par l'utilisateur), depuis la popin d'ajout d'aliment ou depuis le panneau Options.
- Affichage de la liste des aliments **groupée par lieu** (sections avec en-tête sticky).
- Section « Sans localisation » pour les aliments sans lieu défini.

## 4. Liste à acheter

- Génération automatique d'une section « Stock bas » : tous les aliments dont la quantité est passée sous leur stock minimal.
- **Liste manuelle (« Ma liste »)** : ajout libre d'articles indépendants de l'inventaire (pas de quantité/unité/lieu à renseigner), avec case à cocher, suppression par balayage, et bouton pour vider entièrement la liste (avec confirmation). Volontairement absente de l'export/import de sauvegarde (jugée secondaire).
- Accessible depuis un bouton dédié dans l'en-tête (icône panier avec badge indiquant le nombre d'articles en stock bas).
- Clic sur un article de la section « Stock bas » : ouvre directement la popin d'édition de l'aliment correspondant.

## 5. Aliments à consommer en priorité

- Dans chaque lieu de rangement, les aliments **périmés** puis **bientôt périmés** (échéance à J-3 ou moins) remontent automatiquement en haut de la liste, avant les autres (triés ensuite par échéance puis par nom).

## 6. Panneau Options

- Accessible via l'icône « Options » (à côté de l'icône « À acheter ») dans l'en-tête.
- S'ouvre sur un **menu léger** (5 entrées : Lieux de rangement, Unités, Sauvegarde des données, Nous contacter, Nouveautés) ; chaque entrée ouvre sa propre popin dédiée, pour éviter une modal unique surchargée.
- **Lieux de rangement** : liste complète (valeurs par défaut + personnalisées, badge « Par défaut » sur les entrées non supprimables), recherche/filtre par nom (dès que la liste dépasse 5 éléments), création et suppression de lieux personnalisés. Un **contrôle anti-doublon** empêche de créer un lieu portant le même nom (insensible à la casse) qu'un lieu existant, avec une alerte explicite.
- **Unités** : même fonctionnement que les lieux (liste complète, filtre, création/suppression des unités personnalisées, contrôle anti-doublon identique).
- **Sauvegarde des données** : export de tous les aliments, lieux et unités dans un fichier JSON téléchargeable ; import d'un fichier de sauvegarde (remplace l'intégralité des données locales après confirmation).
- **Nous contacter** : formulaire de retour (message requis + e-mail facultatif) envoyé à une base **Netlify Database** (Postgres géré par Netlify) via une fonction serverless dédiée, pour recueillir bugs et suggestions des utilisateurs.
- **Nouveautés** : historique des versions avec, pour chacune, une liste de messages courts et simples (sans détail technique) résumant ce qui a changé.
- Listes à hauteur limitée (scroll interne indépendant, contenu au format mobile) pour rester utilisables même avec de nombreux éléments créés.
- Une confirmation est demandée avant toute suppression ou tout import (opération destructive).

## 7. Persistance des données

- Stockage 100 % local via **IndexedDB** (`FoodRepository`, `LocationRepository`, `UnitRepository`) : pas de backend, fonctionne hors-ligne.
- Les images personnalisées sont stockées sous forme de data URL (base64) directement dans l'enregistrement de l'aliment.

## 8. Internationalisation (i18n)

- Application disponible en **français** et **anglais** (extensible à d'autres langues).
- Basé sur `@ngx-translate/core`, fichiers de traduction JSON dans `src/assets/i18n/` (`fr.json`, `en.json`).
- Sélecteur de langue accessible depuis le panneau Options (« Langue »).
- La langue choisie est **persistée** (local storage) et restaurée au démarrage ; à défaut, la langue du navigateur est utilisée si supportée, sinon le français.
- Les lieux de rangement et unités personnalisés (créés par l'utilisateur) ne sont pas traduits (nom libre) ; seuls les libellés par défaut et l'ensemble de l'interface le sont.

## 9. Interface / UX

- Design mobile-first avec composants Ionic (`ion-item-sliding`, `ion-accordion`, `ion-modal`, `ion-toast`, etc.).
- **Découverte du swipe-to-delete** : au tout premier écran avec un élément glissable rencontré (liste d'aliments ou « Ma liste »), une courte animation révèle une fois le bouton Supprimer pour montrer le geste, jamais répétée ensuite.
- Formulaire d'ajout/édition organisé avec un bloc « Options avancées » repliable (stock minimal, pas d'incrémentation, favori, notes, image) pour ne pas surcharger le formulaire principal.
- Messages de confirmation (toasts) après ajout, modification ou suppression.
- État de chargement et gestion des erreurs affichés à l'utilisateur.
- Application **installable en PWA** (manifeste + service worker Angular). Traductions et
  catalogue sont préchargés, l'application démarre donc sans connexion après la première visite.
- Quand une nouvelle version est déployée, un message propose de recharger l'application ;
  l'utilisateur reste libre de continuer sur la version en cours.

## 10. Stack technique

- Angular 20+ / Ionic 8+, composants **standalone**.
- **Angular Signals** pour la réactivité (aucune dépendance RxJS pour l'état applicatif).
- TypeScript strict, ESLint.
- Capacitor (préparé pour build Android/iOS).
- `@ngx-translate/core` pour l'internationalisation.

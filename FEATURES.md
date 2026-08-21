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
- **Notes libres** par aliment (champ texte optionnel).
- **Image personnalisée** :
  - possibilité d'importer une photo depuis l'appareil (au lieu de l'emoji générique),
  - redimensionnement automatique côté client (max 512 px) et compression JPEG avant stockage,
  - limite de poids du fichier source (8 Mo),
  - suppression de l'image possible (retour à l'icône par défaut).

## 2. Recherche

- Barre de recherche en temps réel, filtrant les aliments par **nom** ou par **lieu de rangement**.

## 3. Lieux de rangement

- Lieux prédéfinis : Frigo, Congélateur, Placard, Autre.
- **Lieux personnalisés** : création libre de nouveaux lieux de rangement (nom choisi par l'utilisateur), depuis la popin d'ajout d'aliment ou depuis le panneau Options.
- Affichage de la liste des aliments **groupée par lieu** (sections avec en-tête sticky).
- Section « Sans localisation » pour les aliments sans lieu défini.

## 4. Liste à acheter

- Génération automatique d'une liste « À acheter » : tous les aliments dont la quantité est passée sous leur stock minimal.
- Accessible depuis un bouton dédié dans l'en-tête (icône panier avec badge indiquant le nombre d'articles).
- Clic sur un article de la liste : ouvre directement la popin d'édition de l'aliment correspondant.

## 5. Panneau Options

- Accessible via l'icône « Options » (à côté de l'icône « À acheter ») dans l'en-tête.
- S'ouvre sur un **menu léger** (3 entrées : Lieux de rangement, Unités, Sauvegarde des données) ; chaque entrée ouvre sa propre popin dédiée, pour éviter une modal unique surchargée.
- **Lieux de rangement** : liste complète (valeurs par défaut + personnalisées, badge « Par défaut » sur les entrées non supprimables), recherche/filtre par nom (dès que la liste dépasse 5 éléments), création et suppression de lieux personnalisés.
- **Unités** : même fonctionnement que les lieux (liste complète, filtre, création/suppression des unités personnalisées).
- **Sauvegarde des données** : export de tous les aliments, lieux et unités dans un fichier JSON téléchargeable ; import d'un fichier de sauvegarde (remplace l'intégralité des données locales après confirmation).
- Listes à hauteur limitée (scroll interne indépendant, contenu au format mobile) pour rester utilisables même avec de nombreux éléments créés.
- Une confirmation est demandée avant toute suppression ou tout import (opération destructive).

## 6. Persistance des données

- Stockage 100 % local via **IndexedDB** (`FoodRepository`, `LocationRepository`, `UnitRepository`) : pas de backend, fonctionne hors-ligne.
- Les images personnalisées sont stockées sous forme de data URL (base64) directement dans l'enregistrement de l'aliment.

## 7. Internationalisation (i18n)

- Application disponible en **français** et **anglais** (extensible à d'autres langues).
- Basé sur `@ngx-translate/core`, fichiers de traduction JSON dans `src/assets/i18n/` (`fr.json`, `en.json`).
- Sélecteur de langue accessible depuis le panneau Options (« Langue »).
- La langue choisie est **persistée** (local storage) et restaurée au démarrage ; à défaut, la langue du navigateur est utilisée si supportée, sinon le français.
- Les lieux de rangement et unités personnalisés (créés par l'utilisateur) ne sont pas traduits (nom libre) ; seuls les libellés par défaut et l'ensemble de l'interface le sont.

## 8. Interface / UX

- Design mobile-first avec composants Ionic (`ion-item-sliding`, `ion-accordion`, `ion-modal`, `ion-toast`, etc.).
- Formulaire d'ajout/édition organisé avec un bloc « Options avancées » repliable (stock minimal, pas d'incrémentation, favori, notes, image) pour ne pas surcharger le formulaire principal.
- Messages de confirmation (toasts) après ajout, modification ou suppression.
- État de chargement et gestion des erreurs affichés à l'utilisateur.
- Application **installable en PWA** (manifeste + service worker Angular). Traductions et
  catalogue sont préchargés, l'application démarre donc sans connexion après la première visite.
- Quand une nouvelle version est déployée, un message propose de recharger l'application ;
  l'utilisateur reste libre de continuer sur la version en cours.

## 9. Stack technique

- Angular 20+ / Ionic 8+, composants **standalone**.
- **Angular Signals** pour la réactivité (aucune dépendance RxJS pour l'état applicatif).
- TypeScript strict, ESLint.
- Capacitor (préparé pour build Android/iOS).
- `@ngx-translate/core` pour l'internationalisation.

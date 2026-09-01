# Stock Alimentaire Ionic - Guide de Démarrage

## Installation et Démarrage

### Prérequis
- Node.js et npm installés
- Ionic CLI (installé en global)

### Lancer l'application en développement

```bash
cd c:\Users\ADE17335\Porte-Document\Projet\Stockaido
ionic serve
```

L'application s'ouvrira automatiquement dans le navigateur à `http://localhost:8100`.

---

## Architecture du Projet

```
src/
├── app/
│   ├── models/              # Interfaces TypeScript (food, food-catalog, unit...)
│   ├── repositories/        # Accès IndexedDB (food, location, unit, shopping-list)
│   ├── services/            # Logique métier avec Signals (food, location, unit,
│   │                         # food-catalog, language, data-transfer, shopping-list, swipe-hint)
│   ├── shared/               # Utilitaires (ex: normalisation de texte pour la recherche)
│   ├── pages/               # Pages principales
│   │   └── home/            # Inventaire principal
│   ├── components/          # Composants réutilisables (add-food-modal, options-modal,
│   │                         # locations-modal, units-modal, backup-modal, create-location-modal)
│   └── app.module.ts        # Configuration Angular (composants standalone importés dedans)
└── assets/
    ├── i18n/                # Traductions fr.json / en.json (@ngx-translate)
    └── catalog/             # Catalogue statique d'aliments (autocomplétion)
```

Voir les [fonctionnalités](fonctionnalites.md) pour l'inventaire complet et à jour, et le
[suivi des versions](suivi-versions.md) / les [décisions d'architecture](decisions/README.md)
pour l'avancement et les choix de conception.

---

## Fonctionnalités Principales (résumé — détail dans [fonctionnalites.md](fonctionnalites.md))

1. **Créer un aliment**
   - Bouton « Ajouter un aliment » en pied de page
   - Nom (avec autocomplétion : inventaire + catalogue de référence), quantité et unité requis
   - Options avancées repliables : stock minimal, pas d'incrémentation, favori, notes, image

2. **Modifier la quantité**
   - Boutons `−` et `+` directement dans la liste, sauvegarde automatique

3. **Supprimer un aliment**
   - Glissement de l'élément (swipe) ou bouton « Supprimer » dans la popin d'édition

4. **Rechercher un aliment**
   - Barre de recherche (nom ou lieu), filtrage en temps réel

5. **Lieux et unités**
   - Valeurs par défaut + création de lieux/unités personnalisés (panneau Options)

6. **Liste « À acheter »**
   - Section « Stock bas » générée automatiquement + section « Ma liste » pour ajouter librement n'importe quel article

7. **Dates de péremption**
   - Date de péremption et d'ouverture par aliment, icône d'alerte et tri automatique par urgence

8. **Stockage local**
   - Toutes les données (aliments, lieux, unités) sont dans IndexedDB, fonctionne hors ligne

9. **Import / export**
   - Sauvegarde et restauration de toutes les données via un fichier JSON

10. **Internationalisation**
   - Interface disponible en français et anglais, choix persistant

---

## Commandes NPM

```bash
# Lancer en développement
npm start

# Ou directement avec Ionic
ionic serve

# Tester dans un mobile Android
ionic capacitor run android

# Tester dans un mobile iOS (macOS uniquement)
ionic capacitor run ios

# Build pour production
npm run build

# Linting / Vérifier le code
npm run lint
```

---

## Architecture Technique

### Stack
- **Frontend**: Angular 20+, Ionic 8+
- **État**: Angular Signals (réactivité)
- **Stockage**: IndexedDB (PWA)
- **Language**: TypeScript

### Patterns Utilisés
- **Repository Pattern**: Séparation données ↔ logique
- **Signal-based State Management**: Réactivité sans RxJS
- **Standalone Components**: Architecture modulaire moderne
- **Dependency Injection**: Service IoC Angular

---

## Modèle de Données

### Food Interface
```typescript
interface Food {
  id: string;              // ID unique généré automatiquement
  name: string;            // Nom de l'aliment (requis)
  quantity: number;        // Quantité (requis)
  unit?: string;           // Unité (Unit enum ou id d'unité personnalisée)
  location?: string;       // Lieu de rangement (StorageLocation enum ou id de lieu personnalisé)
  minimalStock?: number;   // Stock minimal (optionnel)
  step?: number;           // Pas d'incrémentation des boutons +/- (optionnel)
  isFavorite?: boolean;    // Marqué comme favori (optionnel)
  notes?: string;          // Notes supplémentaires (optionnel)
  imageUrl?: string;       // Image personnalisée en data URL (optionnel)
  createdAt: Date;         // Date de création
  updatedAt: Date;         // Date de dernière modification
}
```

`unit` et `location` sont typés en `string` (pas seulement l'enum) pour accepter les identifiants
de lieux/unités personnalisés créés par l'utilisateur.

### StorageLocation Enum
```typescript
enum StorageLocation {
  FRIDGE = 'fridge',
  FREEZER = 'freezer',
  PANTRY = 'pantry',
  OTHER = 'other'
}
```

---

## Principes UX Appliqués

✅ **Minimalisme**: Aucun champ obligatoire (sauf nom et quantité)  
✅ **Rapidité**: Actions directes dans la liste (pas de page d'édition)  
✅ **Clarté**: Groupement par lieu de rangement  
✅ **Accessibilité**: Interface mobile-first, boutons intuitifs  
✅ **Fiabilité**: Persistence locale automatique  

---

## Roadmap

Le suivi de version et les idées non planifiées sont dans le
[suivi des versions](suivi-versions.md) ; les décisions d'architecture (offline-first, catalogue
collaboratif, i18n...) sont dans [decisions/](decisions/README.md).

---

## Troubleshooting

### La base de données ne se crée pas
- Vérifiez la console du navigateur (F12)
- Assurez-vous qu'IndexedDB n'est pas désactivé

### Les changements ne se sauvegardent pas
- Vérifiez que vous n'êtes pas en mode "Private/Incognito"
- Videz le cache du navigateur

### L'application est lente
- C'est normal au premier chargement (initialisation IndexedDB)
- Les chargements suivants seront plus rapides

---

## Notes de Développement

- Le service `FoodService` gère tout l'état avec Signals
- Le repository `FoodRepository` communique avec IndexedDB
- Les composants sont standalone (Angular moderne)
- Aucune dépendance externe pour l'état (pas de NgRx, Redux, etc.)

---

## Contact & Support

Pour toute question ou suggestion, consultez les [fonctionnalités](fonctionnalites.md), les
[décisions d'architecture](decisions/README.md) et le [suivi des versions](suivi-versions.md).

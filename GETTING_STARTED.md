# Stock Alimentaire Ionic - Guide de Démarrage

## Installation et Démarrage

### Prérequis
- Node.js et npm installés
- Ionic CLI (installé en global)

### Lancer l'application en développement

```bash
cd c:\Users\ADE17335\Porte-Document\Projet\StockIonic
ionic serve
```

L'application s'ouvrira automatiquement dans le navigateur à `http://localhost:8100`.

---

## Architecture du Projet

```
src/
├── app/
│   ├── models/              # Interfaces TypeScript
│   │   └── food.model.ts    # Food, StorageLocation, etc.
│   ├── repositories/        # Accès aux données
│   │   └── food.repository.ts  # IndexedDB operations
│   ├── services/            # Logique métier avec Signals
│   │   └── food.service.ts  # État réactif + opérations
│   ├── pages/               # Pages principales
│   │   └── home/            # Inventaire principal
│   ├── components/          # Composants réutilisables
│   │   └── add-food-modal/  # Modal d'ajout d'aliment
│   └── app.module.ts        # Configuration Angular
```

---

## Fonctionnalités V0 (Actuellement Implémentées)

### ✅ Fonctionnalités Principales

1. **Créer un aliment**
   - Cliquez sur le bouton `+` en bas à droite
   - Remplissez le nom, la quantité et le lieu de rangement
   - Les autres champs sont optionnels

2. **Modifier la quantité**
   - Utilisez les boutons `−` et `+` directement dans la liste
   - Les changements sont sauvegardés automatiquement

3. **Supprimer un aliment**
   - Glissez l'élément vers la gauche
   - Cliquez sur "Supprimer" (bouton rouge)

4. **Rechercher un aliment**
   - Tapez dans la barre de recherche en haut
   - La liste filtre en temps réel

5. **Lieux de rangement**
   - Frigo
   - Congélateur
   - Placard
   - Autre

6. **Stockage local**
   - Tous les données sont sauvegardées dans IndexedDB
   - Fonctionne hors ligne
   - Les données persistent même après fermeture de l'app

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
  unit?: string;           // Unité (ex: "g", "ml", optionnel)
  location?: StorageLocation;  // Lieu de rangement (optionnel)
  minimalStock?: number;   // Stock minimal (V1, optionnel)
  isFavorite?: boolean;    // Marqué comme favori (V1, optionnel)
  notes?: string;          // Notes supplémentaires (optionnel)
  createdAt: Date;         // Date de création
  updatedAt: Date;         // Date de dernière modification
}
```

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

## Roadmap V1 (À Venir)

- [ ] Système de favoris (★)
- [ ] Stock minimal par aliment
- [ ] Liste "À acheter" auto-générée
- [ ] Dates de péremption (optionnel)
- [ ] Icônes visuelles pour les catégories
- [ ] Multi-utilisateur (cloud sync)

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

Pour toute question ou suggestion, consultez le fichier `build.md` pour les détails complets des spécifications.

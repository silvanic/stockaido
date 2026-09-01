# 🚀 Stockaido - Application de Gestion de Stock Alimentaire

> ⚠️ Ce document décrit l'état initial (V0) du projet et n'est plus tenu à jour au fil des
> versions. Il est conservé à titre d'historique. Pour l'état **actuel**, voir les
> [fonctionnalités](../fonctionnalites.md) et le [suivi des versions](../suivi-versions.md).

## ✅ Projet Créé avec Succès !

L'application **Stockaido V0** est maintenant prête pour le développement et les tests.

---

## 📋 Ce Qui a Été Implémenté

### Architecture Complète
- ✅ Projet Ionic + Angular initialié avec Standalone Components
- ✅ TypeScript configuré
- ✅ PWA ready

### Core (Modèle de Données & Persistance)
- ✅ `Food` Model avec interfaces TypeScript complètes
- ✅ `FoodRepository` - Accès IndexedDB avec CRUD complet
- ✅ `FoodService` - Logique métier avec Angular Signals
- ✅ Réactivité native sans RxJS

### Interface Utilisateur - V0
- ✅ **Page d'accueil** - Affichage de l'inventaire
  - Groupement par lieu de rangement (Frigo, Congélateur, Placard, Autre)
  - Recherche en temps réel
  - Affichage des quantités

- ✅ **Gestion des quantités**
  - Bouton `−` pour décrémenter
  - Bouton `+` pour incrémenter
  - Mise à jour automatique en local

- ✅ **Gestion des aliments**
  - Modal d'ajout d'aliment
  - Champs : nom, quantité, unité, lieu, notes, stock minimal
  - Suppression par swipe
  - Validation du formulaire

- ✅ **Recherche**
  - Barre de recherche interactive
  - Filtrage en temps réel

### Caractéristiques Techniques
- ✅ Stockage local (IndexedDB)
- ✅ Persistance automatique
- ✅ Fonctionnement hors ligne
- ✅ Aucune dépendance backend
- ✅ Code avec zéro linting errors

---

## 🚀 Comment Démarrer

### Lancer en développement
```bash
ionic serve
```

L'application s'ouvrira automatiquement sur `http://localhost:8100`

### Commandes Utiles
```bash
npm start            # Lancer le serveur de dev
npm run build        # Builder pour production
npm run lint         # Vérifier le code
```

---

## 📚 Documentation

- **[Guide de démarrage](../demarrage.md)** - Guide complet de démarrage
- **[Fonctionnalités](../fonctionnalites.md)** - Inventaire à jour des fonctionnalités
- **[Décisions d'architecture](../decisions/README.md)** / **[Suivi des versions](../suivi-versions.md)**

---

## 🏗️ Structure du Projet

```
src/app/
├── models/
│   └── food.model.ts           # Interfaces & enums
├── repositories/
│   └── food.repository.ts      # IndexedDB operations
├── services/
│   └── food.service.ts         # État réactif (Signals)
├── pages/
│   └── home/                   # Page d'accueil
├── components/
│   └── add-food-modal/         # Modal d'ajout
└── app-routing.module.ts       # Routing config
```

---

## ✨ Fonctionnalités V0 (Actuelles)

### ✅ Implémentées
- [x] Créer un aliment
- [x] Modifier une quantité (+/−)
- [x] Supprimer un aliment
- [x] Rechercher un aliment
- [x] Grouper par lieu de rangement
- [x] Stocker en local (IndexedDB)
- [x] Interface mobile-first
- [x] Zéro dépendances externes pour l'état

### 🔮 Depuis livrées (voir le [suivi des versions](../suivi-versions.md) pour le détail)
- [x] Système de favoris (★)
- [x] Stock minimal par aliment + liste « À acheter » auto-générée
- [x] Image personnalisée, internationalisation FR/EN, catalogue d'autocomplétion
- [ ] Support multi-utilisateur (cloud) — conditionnel, voir la
      [décision 003](../decisions/003-catalogue-collaboratif.md)

---

## 🎯 Principes Appliqués

✅ **Minimalisme** - Aucun champ inutile  
✅ **Rapidité** - Actions directes, pas de clics superflus  
✅ **Accessibilité** - Mobile-first, interface intuitive  
✅ **Fiabilité** - Persistance automatique  
✅ **Architecture propre** - Séparation des responsabilités  

---

## 🛠️ Stack Technique

| Component | Version |
|-----------|---------|
| Angular | 20+ |
| Ionic | 8+ |
| TypeScript | Latest |
| Node | 18+ |
| State Management | Angular Signals (0 dépendance) |
| Storage | IndexedDB |
| PWA | Ready |

---

## 📝 Prochaines Étapes Recommandées

1. **Tester l'application**
   ```bash
   ionic serve
   ```

2. **Ajouter quelques aliments** et tester les fonctionnalités

3. **Pour aller plus loin**
   - Consulter le [guide de démarrage](../demarrage.md) pour un guide détaillé
   - Implémenter les features V1
   - Builder pour Android/iOS si souhaité

---

## 🐛 Troubleshooting

**L'application est lente au premier démarrage ?**  
→ C'est normal, IndexedDB s'initialise. Les chargements suivants seront plus rapides.

**Les données ne se sauvegardent pas ?**  
→ Vérifiez que vous n'êtes pas en mode "Incognito" et qu'IndexedDB n'est pas désactivé.

**Compiler avec des erreurs ?**  
→ Essayez `npm install` et relancez `ng build`

---

## 📞 Support

Pour toute question, consultez:
- [Guide de démarrage](../demarrage.md) - Guide complet
- [Fonctionnalités](../fonctionnalites.md) - Fonctionnalités à jour
- Console du navigateur (F12) pour les erreurs

---

**Happy coding! 🎉**

Créé avec Ionic, Angular, et TypeScript.  
Tout le code est en français et bien commenté.

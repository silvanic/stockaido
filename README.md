# StockIonic

Application Ionic/Angular de gestion de stock alimentaire (frigo, congélateur, placard, lieux de rangement personnalisés), 100 % locale (IndexedDB), pensée mobile-first.

Voir [FEATURES.md](FEATURES.md) pour l'inventaire complet des fonctionnalités et [GETTING_STARTED.md](GETTING_STARTED.md) pour le guide de démarrage.

## Lancer l'application

```bash
npm install
ionic serve
```

## Stack technique

- Angular 20+ / Ionic 8+, composants standalone
- Angular Signals pour la réactivité (pas de RxJS pour l'état applicatif)
- IndexedDB pour la persistance locale
- Capacitor (Android / iOS)

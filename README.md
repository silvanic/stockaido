# StockIonic

Application Ionic/Angular de gestion de stock alimentaire (frigo, congélateur, placard, lieux de rangement personnalisés), 100 % locale (IndexedDB), pensée mobile-first.

## Lancer l'application

```bash
npm install
ionic serve
```

## Stack technique

- Angular 20+ / Ionic 8+, composants standalone
- Angular Signals pour la réactivité (pas de RxJS pour l'état applicatif)
- IndexedDB pour la persistance locale
- PWA (service worker, démarrage hors ligne)
- Capacitor (Android / iOS)

## Documentation

Tout est regroupé dans [docs/](docs/README.md) :

- [Fonctionnalités](docs/fonctionnalites.md) — ce que l'application sait faire aujourd'hui
- [Guide de démarrage](docs/demarrage.md) — installation, architecture, modèle de données
- [Suivi des versions](docs/suivi-versions.md) — ce qui est livré, ce qui reste
- [Décisions d'architecture](docs/decisions/README.md) — pourquoi le projet est fait ainsi

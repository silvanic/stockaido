# Documentation Stockaido

Point d'entrée de la documentation. Chaque document a **un seul rôle** ; en cas de doute sur
l'endroit où écrire une information, ce tableau tranche.

## Où trouver quoi

| Document | Répond à la question | Horizon |
| --- | --- | --- |
| [Fonctionnalités](fonctionnalites.md) | Que sait faire l'application **aujourd'hui** ? | Fait |
| [Guide de démarrage](demarrage.md) | Comment installer, lancer et comprendre le code ? | Fait |
| [Suivi des versions](suivi-versions.md) | Qu'est-ce qui est livré, qu'est-ce qui reste ? | Fait + à faire |
| [Décisions d'architecture](decisions/README.md) | **Pourquoi** le projet est fait ainsi ? | Fait + reporté |
| [Propositions](#propositions) | Qu'est-ce qui est envisagé mais pas tranché ? | À faire |
| [Archive](archive/) | À quoi ressemblait le projet avant ? | Historique |

---

## État du projet

| Version | Contenu | Statut |
| --- | --- | --- |
| v1.0.0 | Socle fonctionnel — CRUD, lieux, unités, favoris, recherche, liste à acheter, i18n, catalogue | ✅ Déployée le 20/08/2026 |
| v1.1 | PWA, service worker, démarrage hors ligne, invite de mise à jour, formulaire de contact, changelog | ✅ Prête à déployer |
| v1.2 | Retours des premiers utilisateurs | 📋 En attente de remontées |
| v1.3 | UX des erreurs réseau | 📋 À planifier |
| v1.5 | Dates de péremption, tri par urgence, recherche par statut, liste manuelle « À acheter », découverte du swipe | ✅ déployé |
| v2.0 | Catalogue collaboratif | ⏸️ Conditionnel — voir [décision 003](decisions/003-catalogue-collaboratif.md) |

Le détail case par case est dans le [suivi des versions](suivi-versions.md).

---

## Conçu mais pas encore engagé

Ces travaux ont une conception aboutie et peuvent être lancés sans phase d'étude préalable.

| Sujet | Document | Ce qui bloque |
| --- | --- | --- |
| Partage du frigo d'un tiers | [Décision 004](decisions/004-partage-de-frigo.md) | Rien — priorisation seulement |
| Commandes vocales | [Proposition](propositions/commandes-vocales.md) | Questions UX ouvertes en fin de document |
| Frigo connecté à plusieurs | [Décision 005](decisions/005-frigo-connecte.md) | Nécessite un backend, et que le besoin d'écriture concurrente soit confirmé |
| Catalogue collaboratif | [Décision 003](decisions/003-catalogue-collaboratif.md) | Nécessite un backend et une base d'utilisateurs réelle |

<a id="propositions"></a>

## Propositions

Le dossier [propositions/](propositions/) contient les conceptions de fonctionnalités **non
tranchées**. Une proposition validée devient une décision dans
[decisions/](decisions/README.md) et des tâches dans le [suivi des versions](suivi-versions.md).

---

## Règles de tenue

- Une information ne doit exister **qu'à un seul endroit** ; ailleurs, on met un lien.
- Une décision actée ne se réécrit pas : on en ajoute une nouvelle qui la remplace.
- Les documents devenus faux ne sont pas corrigés au fil de l'eau : ils partent dans
  [archive/](archive/) avec un avertissement en tête.

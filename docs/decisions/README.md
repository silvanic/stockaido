# Décisions d'architecture

Chaque fichier de ce dossier trace **une décision structurante** : le problème posé, les options
envisagées, le choix retenu et sa justification. Une décision n'est jamais réécrite a posteriori ;
si elle est remise en cause, on en ajoute une nouvelle qui la remplace.

C'est la mémoire de conception du projet — le « pourquoi ». Le « quoi reste à faire » vit dans le
[suivi des versions](../suivi-versions.md).

---

## Principe directeur

> **Offline d'abord.** On privilégie l'implémentation locale d'un maximum de fonctionnalités.
> Pas de backend tant que ce n'est pas strictement indispensable.

L'application est conçue comme une PWA offline-first : IndexedDB comme source de vérité,
aucune dépendance réseau au démarrage, aucun compte utilisateur.

---

## Index

| # | Décision | Statut | Date |
| --- | --- | --- | --- |
| 001 | [Les traductions restent dans des fichiers JSON](001-traductions-en-json.md) | ✅ Actée et appliquée | 20/08/2026 |
| 002 | [Catalogue d'aliments statique embarqué](002-catalogue-embarque.md) | ✅ Implémentée | 20/08/2026 |
| 003 | [Catalogue collaboratif](003-catalogue-collaboratif.md) | ⏸️ Reportée — nécessite un backend | 20/08/2026 |
| 004 | [Partage et consultation du frigo d'un tiers](004-partage-de-frigo.md) | 📐 Conçue, non implémentée | 27/08/2026 |
| 005 | [Frigo connecté, géré à plusieurs](005-frigo-connecte.md) | ⏸️ Reportée — nécessite un backend | 27/08/2026 |

Légende : ✅ en production · 📐 conçue, prête à implémenter · ⏸️ reportée sous condition

---

## Ajouter une décision

Numéro suivant, nom de fichier en minuscules, et un en-tête reprenant le même tableau de statut :

```markdown
# 005 — Titre de la décision

| | |
| --- | --- |
| **Statut** | 📐 Conçue, non implémentée |
| **Date** | JJ/MM/AAAA |
```

Puis ajouter la ligne correspondante à l'index ci-dessus.

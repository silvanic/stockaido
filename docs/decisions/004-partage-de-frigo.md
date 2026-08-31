# 004 — Partage et consultation du frigo d'un tiers

| | |
| --- | --- |
| **Statut** | 📐 Conçue, non implémentée |
| **Date** | 27/08/2026 |
| **Périmètre** | Reste 100 % offline, aucun backend |

Besoin : recevoir le frigo de quelqu'un d'autre, le consulter, puis **revenir à son propre frigo
sans rien perdre**. Le partage se fait par fichier (mail, messagerie, AirDrop) — pas par le réseau.

## Point de départ

`DataTransferService` sait déjà sérialiser l'intégralité des données (`foods`, `locations`,
`locationOrder`, `units`) et les réinjecter via les méthodes `replaceAll()` des trois services.
Le format d'échange existe donc ; il manque la notion de **plusieurs frigos coexistants**.

## Décision — une base IndexedDB par frigo, pas une table de sauvegarde

L'approche intuitive — « je range mon frigo dans une table `backup`, j'importe celui du voisin,
puis je restaure » — a été écartée. C'est un **état modal destructif** :

- `importFromJson()` passe par `clearAll()` puis réinsertion. Entre les deux, les données
  personnelles n'existent plus que dans le blob de secours : une fermeture d'onglet ou une
  exception au mauvais moment et tout est perdu.
- Une seule case de sauvegarde : importer un second frigo sans avoir restauré écrase la
  sauvegarde avec le frigo du voisin.
- Les modifications faites par réflexe pendant la consultation du frigo invité sont soit
  perdues, soit écrites au mauvais endroit.
- Tant qu'on n'a pas restauré, l'export « mes données » n'exporte plus ses données.

Les repositories ouvrent déjà **trois bases distinctes** (`StockIonic`, `StockIonicLocations`,
`StockIonicUnits`) via `indexedDB.open(nom, 1)`. Le nom de base est donc le seul point de
variation à introduire :

```
StockIonic            → frigo personnel (existant, inchangé)
StockIonic__<id>      → frigo importé
```

Changer de frigo = fermer les connexions, rouvrir sur l'autre nom, recharger les signals —
c'est exactement ce que fait déjà `initialize()`.

| | Table de sauvegarde | Base par frigo |
| --- | --- | --- |
| Données existantes | à migrer | intactes, deviennent le frigo par défaut |
| Nombre de frigos | 1 + 1 | N |
| Risque de perte | réel (fenêtre `clear` → `put`) | nul, rien n'est effacé |
| Retour au frigo perso | restauration complète | changement de nom de base |
| Suppression d'un frigo invité | suppression de lignes | `indexedDB.deleteDatabase()` |

Par-dessus : un registre de profils (`localStorage` suffit — `{ id, name, isGuest, importedAt }`)
et un signal `activeProfile`.

## Décision — le partage n'embarque ni images ni notes

Deux intentions distinctes sur un même format de fichier :

| | Sauvegarde | Partage |
| --- | --- | --- |
| Destinataire | soi-même | un tiers |
| Images (`imageUrl`) | conservées | retirées |
| Notes (`notes`) | conservées | retirées |

Retirer les images du partage **supprime le problème** au lieu de le contrôler : plus de data URL
à valider, plus de risque `javascript:`, plus d'URL externe qui ferait fuiter l'adresse IP du
destinataire à l'affichage. Le fichier passe par ailleurs de plusieurs Mo à quelques dizaines de
Ko — les photos sont stockées en base64 dans `Food.imageUrl` — ce qui le rend transmissible par
messagerie sans contorsion.

Les `notes` suivent la même logique : texte libre personnel (« régime de Papi », « allergie de
Léa »), sans intérêt pour qui consulte le frigo, et donnée potentiellement sensible au sens du
RGPD.

La sauvegarde personnelle, elle, doit rester complète : l'amputer serait une régression pour
l'utilisateur qui a photographié ses bocaux.

Aucun changement de modèle nécessaire : `imageUrl` et `notes` sont optionnels et l'affichage
retombe déjà sur l'icône générique.

## Sécurité de l'import

Un fichier reçu est du **contenu non fiable**, quelle que soit son origine apparente.

- **Filtrer aux deux bouts.** Retirer images et notes à l'export ne protège que le fichier qu'on
  produit ; rien ne garantit que le fichier reçu vient de la même version de l'application. Le
  retrait doit être refait à l'import d'un frigo invité.
- **Passer en liste blanche.** `importFromJson()` fait aujourd'hui `{ ...food, createdAt: … }` :
  tout champ présent dans le fichier est recopié en base, y compris des champs inconnus ou un
  `imageUrl` de 40 Mo. Reconstruire l'objet champ par champ règle le problème et tient lieu de
  validation de schéma.
- Plafonner le nombre d'entrées et la taille du fichier.

## Pièges connus

- **`locationOrder`** est en `localStorage` sous `stockionic-location-order`. La clé doit être
  suffixée par le profil, sinon l'ordre du frigo invité écrase celui de l'utilisateur.
- **Collisions d'identifiants** : les ids sont générés en `${Date.now()}-${random}`, donc
  potentiellement identiques entre deux appareils. L'isolation par base neutralise le problème.
  En cas de **fusion** de deux frigos (non prévue), il faudrait régénérer les ids et remapper les
  références `Food.location` / `Food.unit` vers les lieux et unités personnalisés importés.
- **Repère visuel obligatoire** : bandeau ou couleur d'en-tête distincte lorsqu'un frigo invité
  est actif. Sans quoi on ajoutera du lait chez le voisin. Le mode lecture seule sur les frigos
  importés est à envisager.
- **Partage sur mobile** : `<a download>` fonctionne en PWA mais mal dans une WebView Capacitor.
  Prévoir `@capacitor/filesystem` + `@capacitor/share`.

## Réserve

Le principe « offline d'abord » est préservé — aucun backend, aucun compte. Mais le profil actif
devient une dimension transverse du modèle de données : chaque écran ajouté par la suite devra
savoir dans quel frigo il travaille.

## Suite

[Décision 005 — Frigo connecté, géré à plusieurs](005-frigo-connecte.md) prolonge celle-ci pour
l'écriture concurrente à plusieurs appareils. Elle s'appuie sur la multi-base et le registre de
profils décrits ici, et borne la réserve ci-dessus en donnant à chaque type de profil un contrat
de connectivité explicite.

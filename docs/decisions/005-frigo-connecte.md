# 005 — Frigo connecté, géré à plusieurs

| | |
| --- | --- |
| **Statut** | ⏸️ Reportée — conditionnée à un besoin avéré d'écriture concurrente |
| **Date** | 27/08/2026 |
| **Périmètre** | Introduit un backend : c'est la première fonctionnalité qui en exige un |

Besoin : plusieurs personnes d'un même foyer gèrent **le même frigo**, chacune depuis son
appareil, et voient les modifications des autres. Cas d'usage type : ranger les courses à deux,
ou rayer un article pendant que l'autre est au magasin.

À ne pas confondre avec la [décision 004](004-partage-de-frigo.md), qui répond à un besoin
voisin mais distinct : *consulter* le frigo d'un tiers, hors ligne, par fichier.

## Relation avec la décision 004

005 ne remplace pas 004, elle s'appuie dessus.

004 introduit **une base IndexedDB par frigo** (`StockIonic__<id>`) et un registre de profils.
C'est exactement le socle dont 005 a besoin : un frigo connecté n'est qu'un profil de plus, avec
un dépôt de données différent. Implémenter 004 d'abord n'est donc pas un détour — c'est la
première moitié du travail.

| | 004 | 005 |
| --- | --- | --- |
| Besoin | consulter le frigo d'un tiers | gérer un frigo à plusieurs |
| Transport | fichier (mail, messagerie, AirDrop) | réseau |
| Backend | aucun | base de données + fonctions |
| Écriture | non — lecture seule | oui, concurrente |
| Hors ligne | total | dégradé (lecture du cache) |

## Décision — trois profils, deux contrats de connectivité

Le mode connecté est cantonné à son propre profil. Sans cette segmentation, la notion de
« profil actif » devient une dimension transverse du modèle et chaque écran ajouté par la suite
doit raisonner sur la connectivité — c'est la réserve formulée en fin de 004.

| Profil | Source de vérité | Hors ligne | Écriture |
| --- | --- | --- | --- |
| Mon frigo | IndexedDB | total | oui |
| Frigo importé (004) | IndexedDB | total | non, lecture seule |
| Frigo connecté (005) | serveur | dégradé, lecture du dernier instantané | oui, en ligne |

Les deux premiers sont le **même mécanisme** distingué par un drapeau ; seul le troisième
introduit une dépendance réseau. Le principe offline-first reste donc intact là où il compte :
le frigo personnel ne dépend de rien.

**Hors ligne sur un frigo connecté, on dégrade, on ne bloque pas.** Bandeau explicite
(« Hors ligne — données du 27/08 à 14 h 02, modification impossible »), lecture du dernier
instantané reçu, écritures désactivées. Un écran d'erreur pour des données qu'on a en cache
serait gratuitement frustrant.

### Une seule page d'inventaire

Ne pas construire trois pages : ce serait tripler l'inventaire, la recherche, la modale d'ajout,
les lieux et les unités. Il y a **une** page d'inventaire et un profil actif qui détermine le
dépôt et les capacités :

```ts
interface Profile {
  id: string;
  name: string;
  kind: 'own' | 'imported' | 'shared';
  canWrite: boolean;
  requiresNetwork: boolean;
}
```

Les écrans « importer un frigo » et « rejoindre un frigo connecté » existent, mais ce sont des
parcours d'accueil traversés une fois, pas des vues d'inventaire concurrentes.

La bascule entre profils doit rester **immédiate et sans ambiguïté** : un sélecteur dans
l'en-tête, et un repère visuel permanent lorsqu'on n'est pas sur son propre frigo. Sans quoi on
ajoutera du lait chez le voisin.

## Décision — pas de connexion persistante, polling conditionnel

Le réflexe (SSE, ou WebSocket) ne passe pas sur une architecture de fonctions serverless :

- **SSE** et **long polling** maintiennent la réponse ouverte, or les fonctions sont plafonnées
  en durée. Même mur dans les deux cas.
- **WebSocket auto-hébergé** suppose un processus permanent : on quitte le déploiement statique
  + fonctions pour un serveur à surveiller, à redémarrer et à mettre à l'échelle.
- Dans tous les cas, les instances sont isolées : une écriture arrive sur l'une, les connexions
  ouvertes sont sur les autres. Il faudrait un pub/sub entre les deux.

Retenu : **`GET` conditionnel avec `ETag`**, à intervalle adaptatif.

```http
GET /api/fridge/<token>
If-None-Match: "42"

→ 304 Not Modified          (corps vide, aucune lecture des articles)
```

Le serveur compare à `fridge.version` ; il ne lit la table des articles que si elle a changé.
Un tour de boucle coûte quelques centaines d'octets.

| État de l'application | Intervalle |
| --- | --- |
| Premier plan, modification dans la dernière minute | 5 s |
| Premier plan, inactif | 30 s |
| Onglet ou application en arrière-plan | aucun appel |
| Retour au premier plan, retour du réseau | rafraîchissement immédiat |

Ordre de grandeur : quatre personnes, dix minutes d'usage réel par jour, environ
**4 000 appels par mois** — 3 % du palier gratuit Netlify.

Un frigo n'est pas une messagerie : celui qui agit voit sa modification immédiatement (mise à
jour optimiste locale), le délai ne concerne que l'observateur passif. Quelques secondes y sont
imperceptibles.

Le polling a par ailleurs une propriété que les connexions persistantes n'ont pas : **il est
sans état**. Pas de cycle `connecting / open / closed / reconnecting`, pas de reprise après
coupure, pas de question « qu'ai-je manqué pendant les trois minutes de tunnel ». Chaque tour
porte sa question complète. Une coupure de trois heures se rattrape avec le même code qu'un tour
ordinaire.

## Décision — les quantités circulent en delta, pas en valeur absolue

Un `PUT quantity: 4` perd des mises à jour : deux personnes qui incrémentent en même temps, la
dernière écriture gagne, l'autre est effacée sans que personne ne le sache.

En transmettant `+1` / `-2`, l'application atomique en base règle le problème sans mécanisme
supplémentaire — c'est le verrou de ligne du SGBD qui sérialise :

```sql
UPDATE fridge_item
   SET quantity = GREATEST(0, quantity + $1),
       updated_at = NOW()
 WHERE fridge_id = $2 AND id = $3;
```

**Le delta est un format de transport, pas un format de stockage.** L'état reste absolu en base.
Il n'y a pas de journal d'événements : la table grossirait indéfiniment pour un usage où
personne ne consultera jamais l'historique d'un frigo, et toute lecture deviendrait un repli
d'événements — donc des instantanés, donc de la compaction. On paierait la complexité de
l'event sourcing pour son seul bénéfice utile ici, la commutativité, que `quantity + $1` donne
déjà.

## Décision — deux types d'opération, selon l'intention de l'utilisateur

Le delta seul ne suffit pas. Il traduit fidèlement un appui sur `+` / `−`, mais **fausse la
saisie directe** dans la modale de modification : l'utilisateur qui affiche 6 et saisit 2 dit
« j'ai compté, il en reste 2 ». Convertir en `−4` donnerait 1 si quelqu'un a retiré une unité
entretemps.

| Geste | Intention | Opération |
| --- | --- | --- |
| Bouton `+` / `−` | « j'en prends un » — relative | `adjust`, delta |
| Saisie dans la modale | « il en reste deux » — absolue | `set`, valeur |

Le type d'opération suit donc l'intention, il n'est pas uniforme. Le dernier-écrit-gagne du
`set` n'est pas une faiblesse ici : quelqu'un qui vient de compter physiquement a raison contre
la base.

`set` est de toute façon indispensable — le nom, l'unité et le lieu n'ont aucune représentation
en delta.

**N'émettre une opération que pour les champs réellement modifiés.** Comparer la valeur soumise
à celle chargée à l'ouverture de la modale, champ par champ. Une modale ouverte pour corriger un
nom n'écrit alors rien sur la quantité. C'est trivial à implémenter, et c'est la seule
protection réellement nécessaire contre les écrasements accidentels.

### Et pas de détection de conflit

Un `set` peut encore écraser une valeur plus récente si deux personnes saisissent une quantité
pour le même article dans la même poignée de secondes. **On l'accepte en silence.**

L'intensité d'une UI de conflit devrait suivre le coût d'une erreur :

| Domaine | Coût d'un écrasement | Traitement |
| --- | --- | --- |
| Frigo, liste de courses | quasi nul, auto-correctif | aucun |
| Document collaboratif | perte de rédaction | fusion automatique, ou bandeau |
| Paiement, stock marchand | financier | verrou optimiste, erreur explicite |

La source de vérité d'un frigo est le frigo physique : une quantité fausse se corrige en ouvrant
la porte. Une fenêtre demandant d'arbitrer entre deux et cinq yaourts ferait trancher à
l'utilisateur un problème qu'il ne peut pas résoudre depuis son canapé, et qui n'a aucune
conséquence. C'est d'ailleurs le comportement observable des applications comparables — listes
de courses partagées, notes et tâches collaboratives : la valeur change simplement sous les
yeux, sans notification.

Les seuls messages visibles restent génériques : état de connexion, échec d'écriture.

## Décision — idempotence assurée côté serveur

C'est le prix des deltas, et il est non négociable.

Un client ne peut pas distinguer deux situations qui produisent le même symptôme, un délai
d'attente dépassé :

| | |
| --- | --- |
| La requête s'est perdue **à l'aller** | il **doit** réessayer |
| La réponse s'est perdue **au retour** | il **ne doit pas** réessayer |

Seul le serveur sait ce qui s'est réellement passé, et seulement s'il se souvient des opérations
déjà traitées. Sans cela, un `-1` rejoué retire deux unités, silencieusement, sans trace
exploitable. Ce bug n'apparaît pas en développement : il se manifeste chez un utilisateur réel,
en réseau instable, une fois sur cinquante, sous la forme « l'application compte mal ».

Le client génère un `opId` **au moment du clic**, et le conserve pour toutes ses tentatives.
Le serveur le retient :

```sql
INSERT INTO fridge_op (op_id, fridge_id) VALUES ($1, $2)
ON CONFLICT (op_id) DO NOTHING;
```

Si aucune ligne n'est insérée, l'opération a déjà été appliquée : on ne touche à rien et on
renvoie l'état courant. Le tout dans la même transaction que l'`UPDATE`.

`fridge_op` ne stocke **aucune charge utile** — un identifiant, un frigo, une date. C'est
possible parce que toutes les réponses de l'API sont « voici l'état complet du frigo » : le
client reçoit la même chose que l'opération vienne d'être appliquée ou l'ait déjà été. Avec une
réponse du type `{ nouvelleQuantité: 5 }`, il faudrait au contraire mémoriser chaque réponse
pour la rejouer à l'identique.

Purge opportuniste au-delà de 30 jours, déclenchée à l'écriture avec une faible probabilité
plutôt que par une tâche planifiée.

`fridge_op` protège aussi les opérations `set`. Un `set` rejoué est naturellement idempotent,
mais un `set` **périmé** rejoué après une modification plus récente l'écraserait — la
déduplication l'en empêche.

## Décision — en v1, les écritures exigent le réseau

Autoriser les écritures hors ligne impose une **file d'attente persistante** (outbox) dans
IndexedDB : opérations conservées à la fermeture de l'application, vidage ordonné, distinction
entre échecs réessayables (réseau, 5xx) et définitifs (4xx — sans quoi une opération invalide
bloque la file indéfiniment), plafonds de taille et d'âge, verrou pour éviter deux vidages
concurrents, et état affiché = instantané serveur + repli des opérations en attente.

C'est beaucoup de code pour un gain limité : pouvoir ranger ses courses dans le frigo partagé
depuis un parking souterrain.

En v1, une écriture hors ligne est refusée avec un message clair. Le client se contente de deux
ou trois tentatives immédiates. `fridge_op` reste nécessaire — un délai dépassé se produit aussi
en ligne — mais la complexité côté client disparaît presque entièrement.

L'outbox reste **ajoutable après coup sans rien casser**, puisque les deltas et l'idempotence
sont déjà en place. C'est précisément pour cela qu'ils ne sont pas reportés, eux.

## Schéma de données

```sql
CREATE TABLE fridge (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  BYTEA NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  version     BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fridge_item (
  fridge_id  UUID NOT NULL REFERENCES fridge(id) ON DELETE CASCADE,
  id         TEXT NOT NULL,
  name       TEXT NOT NULL,
  quantity   NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit       TEXT,
  location   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (fridge_id, id)
);

CREATE TABLE fridge_op (
  op_id      UUID PRIMARY KEY,
  fridge_id  UUID NOT NULL REFERENCES fridge(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`version` est incrémentée à chaque écriture : c'est la valeur de l'`ETag`, et elle permet de
répondre `304` en lisant une seule ligne.

Ni `imageUrl` ni `notes`, conformément à 004 — et l'argument y gagne : on n'héberge pas les
photos de frigo des utilisateurs.

## Contrat d'API

| | |
| --- | --- |
| `POST /api/fridge` | crée un frigo, renvoie le jeton **une seule fois** |
| `GET /api/fridge/<token>` | état complet, ou `304` avec `If-None-Match` |
| `POST /api/fridge/<token>/op` | applique une opération, renvoie l'état complet |

Toute écriture renvoie l'**état complet** et la nouvelle version : le client réconcilie son
optimiste dessus et le tour de polling suivant n'a rien à faire.

Pas d'endpoint de différentiel. Le `304` élimine déjà l'essentiel du trafic, et un protocole
différentiel imposerait de gérer le cas « ce client a trop de retard, il manque des versions » —
qui se résout par un renvoi complet.

## Sécurité

L'URL du frigo est une **capability URL** : la détenir, c'est avoir le droit. C'est le bon
compromis pour rester sans compte ni authentification, à condition de respecter quelques règles.

- **Jeton cryptographiquement aléatoire** (`crypto.randomUUID()` ou 128 bits), jamais un
  identifiant séquentiel qui s'énumère.
- **Stocker `sha256(jeton)`, pas le jeton.** C'est un identifiant porteur, l'équivalent d'un mot
  de passe : un accès à la base ne doit pas ouvrir tous les frigos. L'entropie étant déjà
  maximale, un hachage lent n'apporte rien.
- **Prévoir la rotation dès le départ.** Une URL fuite (capture d'écran, groupe de discussion,
  historique) et l'accès devient permanent et irrévocable.
- **Éviter le jeton dans le chemin** s'il y a moyen : il part dans l'en-tête `Referer` vers tout
  script tiers. Fragment d'URL ou en-tête après un premier échange.
- **Limitation de débit obligatoire.** Sans authentification, quiconque détient l'URL peut vider
  le frigo en boucle.
- **Filtrer les entrées en liste blanche**, champ par champ, comme prévu en 004. Plafonner le
  nombre d'articles et la taille des requêtes.
- **Rétention et suppression** : on héberge les données de tiers, il faut un moyen de supprimer
  un frigo et une purge des frigos inactifs (`accessed_at`).

## Fournisseur — Netlify Database ou Supabase

Non tranché ; les deux tiennent.

| | Netlify Database (existant) | Supabase |
| --- | --- | --- |
| Continuité | déjà en place pour le formulaire de contact | seconde plateforme, ou migration du contact |
| Temps réel | polling uniquement | Realtime inclus, sans pub/sub à écrire |
| Isolation par frigo | dans le code des fonctions | RLS au niveau de la base |
| Piège | plafond de durée des fonctions | palier gratuit mis en pause après ~7 jours d'inactivité |

Supabase devient franchement intéressant si le temps réel s'avère nécessaire : il fournit
exactement la partie *stateful* que le serverless ne sait pas faire. Et deux bases de données
pour un projet de cette taille, c'est déjà une de trop — l'adopter impliquerait d'y déplacer
aussi la table `feedback`.

Le choix du fournisseur reste **prématuré** tant que le besoin d'écriture concurrente n'est pas
confirmé.

### Écartée — migrer l'ensemble des données vers Supabase

Adopter Supabase pour la tranche « frigo connecté » est une chose ; en faire la source de vérité
de l'application en est une autre, et celle-là est rejetée.

- Elle **abandonne l'offline-first**, qui est le principe directeur du projet : écran de
  chargement, compte utilisateur, application inutilisable sans réseau. Pour une application de
  gestion de frigo, c'est une régression frontale.
- « Garder IndexedDB en cache et synchroniser » n'est pas une migration mais l'écriture d'un
  **moteur de synchronisation bidirectionnelle** : conflits sur tout le modèle et non plus sur
  les seules quantités, suppressions concurrentes, pierres tombales, horloges. Ce coût
  retomberait sur *chaque* fonctionnalité future, pas seulement sur le frigo partagé.
- La flexibilité invoquée est **spéculative** : on ne sait pas encore si le frigo connecté
  trouvera son public — c'est la raison même du report de cette décision.

## Pièges connus

- **`NgZone.runOutsideAngular` sur le minuteur de synchronisation.** Un minuteur suivi par
  zone.js empêche `ApplicationRef` de devenir stable, donc `registerWhenStable:30000` ne se
  déclenche jamais, donc **le service worker ne s'enregistre plus** et la PWA cesse de
  fonctionner hors ligne — sans la moindre erreur affichée. Le projet s'est déjà fait prendre
  exactement ainsi sur `AppUpdateService`. Un minuteur permanent est le cas le plus sûr de
  reproduire ce bug : à traiter dès la première ligne.
- **`setTimeout` récursif, pas `setInterval`.** Avec `setInterval`, une réponse lente empile les
  requêtes concurrentes ; le tour suivant doit être planifié après la réponse du précédent.
- **Repli exponentiel sur échec**, plafonné à quelques minutes, sinon une panne serveur se fait
  marteler par tous les clients.
- **L'`opId` est généré au clic, jamais à l'envoi.** Le régénérer à chaque tentative rend
  `fridge_op` inopérante — et l'échec est silencieux.
- **Ne pas convertir une saisie de quantité en delta.** Les boutons émettent `adjust`, la modale
  émet `set` ; confondre les deux fausse le résultat dès qu'une modification concurrente survient.
- **Distinguer 4xx et 5xx** côté client : un `404` (article supprimé par quelqu'un d'autre) ne
  se répare pas en réessayant.
- **Clé `stockionic-location-order`** à suffixer par profil, déjà signalé en 004.
- **Repère visuel permanent** quand un frigo autre que le sien est actif.

## Condition de déclenchement

Cette décision reste en attente tant que la question suivante n'a pas de réponse observée :
les utilisateurs veulent-ils *consulter* le frigo d'un tiers, ou le *modifier ensemble* ?

La [décision 004](004-partage-de-frigo.md) répond au premier besoin pour un coût d'exploitation
nul. Toute la mécanique décrite ici — deltas, idempotence, polling — n'existe que parce qu'il y
a écriture concurrente. Si personne ne la réclame, il n'y a rien à construire.

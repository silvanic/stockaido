# Plan — Gestion du stock par commande vocale

> Statut : proposition à review, rien n'est encore implémenté.

## ⚠️ Point d'arbitrage à valider (mis à jour)

Correction par rapport à la première version de ce plan : la Web Speech API propose bien un mode **on-device** (`SpeechRecognition.processLocally = true` + `SpeechRecognition.available()`/`install()` pour gérer le téléchargement d'un pack de langue), documenté sur [MDN — On-device speech recognition](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API#on-device_speech_recognition). Une fois le pack de langue installé, la reconnaissance web peut donc fonctionner hors-ligne.

⚠️ Nuances importantes :
- Support navigateur **très récent et partiel** (à vérifier au moment de l'implémentation via [caniuse/MDN browser compat](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally)) — probablement Chrome/Edge desktop récents uniquement, pas garanti sur mobile ni Safari.
- Le pack de langue doit être installé une première fois (`install()`), ce qui nécessite une connexion au moins lors de ce premier téléchargement.
- Sans support de `processLocally` sur le navigateur de l'utilisateur, on retombe sur le mode serveur classique (en ligne uniquement).

Approche retenue dans ce plan (mise à jour) :
- **Web/PWA (V1, ce plan)** → tenter `processLocally = true` (offline si le navigateur le supporte et le pack est installé), avec repli automatique sur le mode serveur (en ligne) si `available()` renvoie `unavailable` ou si la propriété n'existe pas sur le navigateur. Message explicite si hors-ligne ET mode serveur requis ("fonctionnalité vocale indisponible sans connexion sur ce navigateur").
- **Natif (Android/iOS, V2 — plus tard)** → reconnaissance offline réelle via `@capacitor-community/speech-recognition` (`requiresOnDeviceRecognition`). Non traité dans cette itération, mais l'architecture ci-dessous est pensée pour ajouter ce backend sans réécrire le parser ni l'UI.

## Décision : on commence par le web/PWA uniquement

La version native (Android/iOS) est reportée à une itération ultérieure, une fois le web/PWA bien avancé et validé en usage réel. Ça permet de livrer vite une valeur utile (l'essentiel des utilisateurs passent par la PWA) sans bloquer sur l'intégration Capacitor + permissions natives + tests sur device.

## Périmètre de la V1 (issu des réponses précédentes)

- Plateforme : web/PWA uniquement pour cette itération (le natif viendra en V2, voir plus bas).
- Commandes couvertes :
  - Ajouter un aliment ("ajoute 2 tomates au frigo")
  - Incrémenter / décrémenter une quantité ("ajoute un yaourt", "enlève une pomme")
  - Rechercher un aliment vocalement
- Déclenchement : bouton dédié, push-to-talk (appui → parle → relâche/fin).
- Langues : français + anglais, suit la langue courante de l'app (`LanguageService`).
- Retour utilisateur : toast visuel **+** confirmation vocale (synthèse vocale).

## 1. Architecture

```
src/app/
  services/
    voice-command.service.ts               # façade, expose listen()/speak() à l'UI
    speech-recognition-web.adapter.ts       # wrap window.SpeechRecognition, tente processLocally puis repli serveur
  shared/
    voice-command-parser.ts                # fonctions PURES (testables) : texte -> intention structurée
  components/
    voice-command-button/                  # bouton mic (push-to-talk) + états idle/listening/processing/error
```

`VoiceCommandService` s'appuie sur une interface `SpeechRecognitionAdapter` (`listen(lang): Promise<string>` + événements `onResult`/`onError`). Un seul adaptateur (web) est implémenté dans cette itération, mais l'interface permet d'ajouter un `speech-recognition-native.adapter.ts` (V2) sans toucher au parser ni à l'UI.

## 2. Dépendances

- Aucune dépendance supplémentaire pour le web : `SpeechRecognition` / `webkitSpeechRecognition`, natif du navigateur. L'adaptateur web vérifie `SpeechRecognition.available({ langs, processLocally: true })` et propose `install()` si un pack de langue peut être téléchargé, sinon bascule sur le mode serveur classique.
- Aucune permission native à gérer pour cette itération (pas de Capacitor concerné). Le navigateur demande lui-même l'autorisation micro via son prompt standard.

## Rappel V2 (plus tard, hors périmètre actuel)

- `@capacitor-community/speech-recognition` (Android/iOS, supporte `requiresOnDeviceRecognition` pour l'offline réel).
- Permissions natives à ajouter à ce moment-là : `RECORD_AUDIO` (Android `AndroidManifest.xml`), `NSSpeechRecognitionUsageDescription` + `NSMicrophoneUsageDescription` (iOS `Info.plist`).
- Bascule automatique via `Capacitor.isNativePlatform()` dans `VoiceCommandService`.

## 3. Grammaire des commandes (FR + EN)

Parser à base de mots-clés + petites regex (pas de NLU lourd, cohérent avec le reste du projet) :

| Intention | Exemples FR | Exemples EN |
|---|---|---|
| Ajouter | "ajoute 2 tomates au frigo", "ajoute des yaourts" | "add 2 tomatoes to the fridge" |
| Incrémenter | "ajoute un yaourt" (aliment déjà existant → +1) | "add one yogurt" |
| Décrémenter | "enlève une pomme", "retire 2 œufs" | "remove one apple" |
| Recherche | "cherche les pommes", "trouve tomate" | "search tomatoes" |

Détails :
- Table de nombres écrits (un/deux/trois... zéro à vingt) FR + EN → conversion en `number`, en plus des chiffres.
- Nom d'aliment : recherche floue via `normalizeForSearch` (existant), matché contre `foodService.foods$()` puis le catalogue (`FoodCatalogService`) si pas de match exact — même logique que l'autocomplete actuel de la modale d'ajout.
- Lieu : matché contre `STORAGE_LOCATION_LABELS` + lieux personnalisés (`LocationService`), sinon lieu par défaut / dernier utilisé.
- Ambiguïté (plusieurs aliments proches) → ne pas deviner : proposer une confirmation visuelle (liste courte à choisir) plutôt qu'exécuter au hasard.

## 4. Flux d'exécution

1. Utilisateur appuie sur le bouton mic (push-to-talk) → état `listening`.
2. Transcription reçue → état `processing` → `voice-command-parser` produit une intention typée (`{type: 'add'|'increment'|'decrement'|'search', payload}` ou `{type: 'unrecognized', raw}`).
3. Intention exécutée via les services existants (`FoodService.createFood` / mise à jour de quantité, ou remplissage de la searchbar).
4. Confirmation : toast (pattern déjà utilisé partout dans l'app) **+** synthèse vocale (`SpeechSynthesisUtterance`, disponible en web et en WebView natif) dans la langue courante.
5. Échec de compréhension → toast d'erreur avec le texte transcrit ("Je n'ai pas compris : « ... »"), pas de blocage ni de crash.

## 5. UI

- Bouton mic dans le header de `home.page.html`, à côté des boutons thème / à-acheter existants.
- États visuels : icône `mic-outline` (idle) → `mic` rouge pulsant (listening) → spinner (processing).
- Permission refusée : toast explicite (pas de crash silencieux).

## 6. i18n

Nouvelles clés `voiceCommand.*` dans `fr.json` / `en.json` :
- Libellés bouton / aria-label
- Messages de confirmation (ex. "{{qty}} {{name}} ajouté(s)")
- Messages d'erreur / incompréhension
- Message "indisponible hors-ligne sur navigateur"

## 7. Tests

- `voice-command-parser.spec.ts` : tests unitaires purs sur les phrases d'exemple ci-dessus (FR/EN, nombres en chiffres et en lettres, pluriels, lieux).
- Test manuel navigateur (micro du poste, Chrome/Edge en priorité).

## 8. Étapes de mise en œuvre proposées (V1 web/PWA)

1. `voice-command-parser.ts` + tests unitaires (aucune dépendance externe, validable immédiatement).
2. Adaptateur web (Web Speech API, avec tentative `processLocally`) + bouton mic + intégration `FoodService` (version la plus rapide à démontrer).
3. Synthèse vocale de confirmation.
4. Gestion des cas d'ambiguïté / échec + i18n complet.
5. Documentation dans `ROADMAP.md` / `TODO.md` (convention du projet) une fois livré.

## V2 — version native (plus tard, une fois le web bien avancé)

1. Installation `@capacitor-community/speech-recognition`.
2. `speech-recognition-native.adapter.ts` implémentant la même interface que l'adaptateur web.
3. Permissions Android/iOS (voir section 2).
4. Bascule automatique dans `VoiceCommandService` via `Capacitor.isNativePlatform()`.
5. Tests manuels sur device Android/iOS réel (le simulateur ne capture pas toujours l'audio correctement).

## Questions ouvertes / à trancher avant de démarrer

- [ ] Comportement web hors-ligne : mode dégradé (message d'erreur) ou fonctionnalité masquée entièrement ?
- [ ] Faut-il gérer des variantes de formulation plus larges dès la V1, ou rester strict sur les tournures listées ?
- [ ] Faut-il un retour vocal désactivable (paramètre) pour les utilisateurs qui préfèrent le silence ?

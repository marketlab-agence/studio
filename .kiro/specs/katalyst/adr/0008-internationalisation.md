# ADR 0008 — Internationalisation : application transatlantique

- **Statut** : accepté
- **Date** : 2026-09-21
- **Remplace** : `NG-04` (« i18n multi-langue » — non-goal de `requirements.md`)
- **Phases concernées** : 8, et toutes les phases d'interface

## Contexte

### La décision antérieure

`NG-04` écartait l'internationalisation :

> NG-04 | i18n multi-langue | App française

Ce choix était cohérent avec un usage mono-pays.

### Ce qui a changé

L'utilisateur demande une application **transatlantique** : utilisable **hors de France et hors du français**, avec une contrainte explicite :

> « au maximum 2 langues sont obligatoires pour l'usage de la web app (**FR et EN**) mais si le temps le permet on peut mettre **ES** »

Il y a donc **une exigence ferme (FR + EN)** et une **option (ES)**.

### Contrainte technique

`AGENTS.md` documente `lang="fr"` et une copie intégralement française. Le projet frère `masterplan365` dispose d'un système i18n (`_t('fr','en')` + `public/locales/{lang}/translation.json`) — un précédent réutilisable.

Point critique : **les 6 formations existantes sont en français**. L'i18n ne concerne donc pas seulement l'interface mais aussi **le contenu**.

## Décision

1. **FR et EN obligatoires**, ES optionnel (activé si le planning le permet).
2. **Infrastructure i18n posée tôt** (phase 8), avant toute construction d'interface — pour éviter une reprise massive.
3. **Routage par locale** : `/fr/...`, `/en/...` avec locale par défaut déduite de la navigation.
4. **Formats localisés** : dates, nombres, devises, fuseaux horaires.
5. **Contenu traduisible** : le modèle de données porte la locale ; la traduction du contenu est **assistée par IA** (famille TTT du studio, phase 16).
6. **Séparation stricte** : aucune chaîne en dur dans les composants ; toutes les chaînes passent par le catalogue.
7. **Langue = attribut d'utilisateur et d'organisation**, pas une constante globale.

## Conséquences

### Positives
- Katalyst devient commercialisable hors de France — condition de l'ambition « transatlantique ».
- L'infrastructure posée tôt évite une reprise coûteuse des interfaces.
- La traduction de contenu par IA est un usage naturel du studio à crédits (valeur ajoutée).
- Prépare la conformité multi-juridiction (voir ADR 0011).

### Négatives / coûts
- **Toute l'interface existante doit être extraite** en clés de traduction (retrofit).
- **Le contenu doit être traduit** : 6 formations en français à dupliquer en anglais.
- Complexité accrue des tests (matrice de locales).
- Les captures REWORK servent de référence visuelle — la version EN peut différer en longueur de libellés.
- Risque de dérive : une clé ajoutée en FR sans EN casse l'expérience.

### Mitigation
- Lint i18n : toute clé absente d'une langue obligatoire → **erreur de build**.
- Locale par défaut : FR. Repli automatique documenté.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Rester français (NG-04)** | Contredit l'exigence transatlantique explicite |
| **Traduction par fichiers statiques uniquement** | Ne couvre pas le contenu dynamique (formations, leçons) |
| **FR + EN + ES dès le départ** | ES est explicitement conditionné au temps disponible |
| **Détection automatique de la langue uniquement** | Insuffisant : l'utilisateur doit pouvoir choisir et persister son choix |

## Références

- `@.kiro/specs/katalyst/requirements.md` domaine `I18N`
- `@.kiro/specs/katalyst/design.md` §18
- `@.kiro/specs/katalyst/tasks.md` phase 8
- Précédent : `masterplan365` (`_t('fr','en')`, `public/locales/`)

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

Point critique : **les 6 formations existantes sont en français**. Elles ne changeront pas — elles portent leur langue, ce n'est pas un défaut à corriger.

## Amendement du 2026-09-23 — la langue du contenu n'est pas une traduction

La version initiale de cet ADR prévoyait que **le contenu soit traduisible** : « une formation existe en FR et EN », avec traduction assistée par IA (ex-`REQ-I18N-08`/`09`). **Cette conception est abandonnée.**

⚠️ **Pourquoi elle était fausse.** Katalyst est un **outil de création** : un formateur écrit sa formation dans **sa** langue. Lui imposer de maintenir une seconde version traduirait l'usage réel — la plupart des créateurs n'ont pas besoin de publier en deux langues, et l'exigence aurait produit du travail de traduction sans valeur ajoutée.

**Ce qui remplace** : la langue est un **attribut de la formation**, choisi par son créateur et **figé** pour cette formation. Il n'existe pas « une formation en FR et EN » — il existe **des formations dans différentes langues**. Aucune traduction n'est requise ni assistée.

**Conséquence sur l'usage** : l'interface suit la langue de **l'utilisateur** ; le contenu suit la langue de **son créateur**. Les deux sont indépendants. Le catalogue affiche toutes les formations, **marque leur langue** et permet de filtrer (voir la conception de la phase 8).

## Décision

1. **FR et EN obligatoires**, ES optionnel (activé si le planning le permet).
2. **Infrastructure i18n posée tôt** (phase 8), avant toute construction d'interface — pour éviter une reprise massive.
3. **Routage par locale** : `/fr/...`, `/en/...` avec locale par défaut déduite de la navigation.
4. **Formats localisés** : dates, nombres, devises, fuseaux horaires.
5. **La langue du contenu est un attribut de la formation** (colonne `courses.language`), choisi par le créateur. **Aucune traduction obligatoire, aucune traduction assistée** (amendement du 2026-09-23).
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
- Complexité accrue des tests (matrice de locales).
- Les captures REWORK servent de référence visuelle — la version EN peut différer en longueur de libellés.
- Risque de dérive : une clé ajoutée en FR sans EN casse l'expérience.
- ⚠️ **Coût retiré par l'amendement du 2026-09-23** : le contenu n'a plus à être traduit. Les 6 formations existantes restent en français — leur langue est déclarée `fr`, c'est un état normal, pas une dette.

### Mitigation
- Lint i18n : toute clé absente d'une langue obligatoire → **erreur de build**.
- Locale par défaut : FR. Repli automatique documenté.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Rester français (NG-04)** | Contredit l'exigence transatlantique explicite |
| **Traduction par fichiers statiques uniquement** | Ne couvre pas l'interface dynamique (libellés, messages d'erreur) |
| **FR + EN + ES dès le départ** | ES est explicitement conditionné au temps disponible |
| **Détection automatique de la langue uniquement** | Insuffisant : l'utilisateur doit pouvoir choisir et persister son choix |
| **Contenu traduisible (une formation en FR et EN)** | ⚠️ **Écartée le 2026-09-23** : la langue est un attribut de la formation, pas une traduction à maintenir. Imposer deux versions aurait traduit l'usage réel de l'outil de création. |

## Références

- `@.kiro/specs/katalyst/requirements.md` domaine `I18N`
- `@.kiro/specs/katalyst/design.md` §18
- `@.kiro/specs/katalyst/tasks.md` phase 8
- Précédent : `masterplan365` (`_t('fr','en')`, `public/locales/`)

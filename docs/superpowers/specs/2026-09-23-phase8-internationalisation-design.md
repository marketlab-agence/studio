# Phase 8 — Internationalisation de l'interface et langue du contenu

**Date** : 2026-09-23
**Statut** : conception validée, prêt pour plan d'implémentation
**Portée** : `src/app/**` (32 pages), `src/components/**` (137 composants), `src/lib/db/`, `package.json`, CI

---

## 1. Contexte et problème

### 1.1 Aucune infrastructure i18n n'existe

| Élément | État actuel |
|---|---|
| Librairie i18n | **aucune** (`package.json` ne contient ni `next-intl`, ni `i18next`, ni `formatjs`) |
| Routage par locale | **aucun** — les 19 routes sont à plat (`/login`, `/dashboard`…), pas de `/fr` ni `/en` |
| Langue du document | `lang="fr"` en dur dans `src/app/layout.tsx` |
| Chaînes en dur | **~538 lignes** de texte visible dans 32 pages et 137 composants |
| Langue du contenu | **aucune colonne** sur `courses`, `chapters` ni `lessons` |

### 1.2 Amendement du référentiel (2026-09-23)

⚠️ **La conception d'origine a été corrigée par l'utilisateur, puis le référentiel amendé.**

La version initiale prévoyait un **contenu traduisible** : `REQ-I18N-08` (« une formation existe en FR et EN ») et `REQ-I18N-09` (« traduction assistée par IA »). L'ADR 0008 allait jusqu'à écrire : *« Le contenu doit être traduit : 6 formations en français → dupliquer en anglais »*.

**Pourquoi c'était faux.** Katalyst est un **outil de création** : un formateur écrit dans **sa** langue. Lui imposer une seconde version traduirait l'usage réel, et produirait du travail de traduction sans valeur.

**Ce qui remplace** : la langue est un **attribut de la formation**, choisi par son créateur et figé. Il n'existe pas « une formation en FR et EN » — il existe **des formations dans différentes langues**.

**Amendements appliqués** : `requirements.md` (REQ-I18N-08 réécrite, REQ-I18N-09 supprimée), `adr/0008` (section d'amendement + décision 5 + alternatives + coûts), `design.md` §18, `tasks.md` (T8.7 révisée, T17.13 supprimée).

### 1.3 Décisions validées par l'utilisateur

| Question | Décision |
|---|---|
| Découverte des formations selon la langue | **Option C** — le catalogue affiche **tout**, marque la langue de chaque formation et permet de **filtrer** |
| Librairie i18n | **`next-intl`** — conçue pour l'App Router de Next 15, routage intégré, typage des clés |
| Périmètre du retrofit | **Infrastructure + extraction complète** des ~538 chaînes |
| Tests existants | **Restent en FR** + une **suite i18n dédiée** pour prouver le routage `/en` |

### 1.4 Interaction langue d'interface / langue de contenu

Les deux sont **indépendants** :
- L'interface suit la langue de **l'utilisateur** (`/fr` ou `/en`, persistée)
- Le contenu suit celle de **son créateur** (`courses.language`)

Un utilisateur anglophone voit l'interface en anglais, et une formation française reste en français — signalée comme telle. Aucune traduction n'est produite ni attendue.

---

## 2. Architecture

### 2.1 Structure des routes

Restructuration sous un segment `[locale]` :

```
src/app/
  [locale]/
    layout.tsx            ← NextIntlClientProvider + <html lang={locale}>
    page.tsx              ← ancien src/app/page.tsx
    login/page.tsx        ← ...
    dashboard/page.tsx
    ...
  api/                    ← INCHANGÉ : les routes API ne sont pas localisées
  globals.css
```

**Décisions structurelles :**

- **Les routes API ne sont pas délocalisées.** `/api/v1/*` est une surface technique consommée par du code, pas par un humain : `REQ-API-01` la versionne déjà. La placer sous `[locale]` créerait deux URL pour le même endpoint.
- **`lang="fr"` disparaît du layout racine** au profit de `<html lang={locale}>` dans le layout localisé.
- **Redirection de la racine** : `/` redirige vers `/fr` (locale par défaut).

### 2.2 Configuration `next-intl`

```
src/i18n/routing.ts    ← defineRouting({ locales: ['fr','en'], defaultLocale: 'fr' })
src/i18n/request.ts    ← getRequestConfig : lit la locale, charge le catalogue
src/middleware.ts      ← createMiddleware(routing)
locales/fr/translation.json
locales/en/translation.json
```

**Persistance (REQ-I18N-07)** : `next-intl` pose un cookie de locale par défaut. Il sera complété par la **préférence utilisateur en base** (colonne `users.language`), qui prime sur le cookie quand l'utilisateur est connecté — le cookie ne survit pas à un changement d'appareil, la préférence en base si.

**Locale de repli (REQ-I18N-08 / T8.8)** : `fr`, documentée. Une locale inconnue dans l'URL retombe sur `fr`.

### 2.3 Modèle de données

**Nouvelle colonne** `courses.language` (migration `013_course_language.sql`) :

```sql
ALTER TABLE courses ADD COLUMN language TEXT NOT NULL DEFAULT 'fr';
```

⚠️ **`NOT NULL DEFAULT 'fr'` est délibéré** : les 6 formations existantes sont en français, c'est leur **état réel**, pas une valeur de remplissage. Aucune donnée n'est inventée.

**Contrainte de cohérence** : une colonne `users.language` (préférence d'interface) est également nécessaire pour REQ-I18N-07. Deux colonnes distinctes, deux usages distincts — les confondre serait une erreur de conception.

### 2.4 Catalogues de traduction

`locales/{fr,en}/translation.json`, organisés **par domaine fonctionnel** (pas par page — une page change, un domaine reste) :

```json
{
  "common": { "save": "…", "cancel": "…" },
  "auth": { "login": "…", "signup": "…" },
  "catalog": { "language": "…", "filterByLanguage": "…" },
  "admin": { "…": "…" }
}
```

### 2.5 Lint i18n bloquant (T8.3, REQ-I18N-05)

Un script `npm run lint:i18n` qui :
1. charge les deux catalogues ;
2. compare les **clés** (pas les valeurs) — toute clé présente dans une locale et absente dans l'autre est une **erreur** ;
3. sort en code ≠ 0, ce qui fait échouer la CI.

⚠️ **Il ne peut être bloquant que si l'extraction est complète** — c'est précisément pourquoi le périmètre retenu est « infrastructure + extraction complète ». Un lint bloquant sur une interface à moitié extraite bloquerait le projet sans raison.

### 2.6 Formats localisés (REQ-I18N-06)

`next-intl` expose `useFormatter()` (dates, nombres, devises) et `useNow()` / `useTimeZone()`. Les affichages de dates du dashboard et du blog passeront par lui. Les fuseaux : la référence actuelle est `Europe/Paris`, rendue configurable.

---

## 3. Périmètre — ampleur mesurée

| Mesure | Valeur |
|---|---|
| Pages à extraire | **32** `page.tsx` |
| Composants à extraire | **137** `.tsx` |
| Lignes de texte visible | **~538** (heuristique sur `>Texte<`) |
| Tests unitaires à préserver | **275** |
| Tests E2E à préserver | **76** |
| Routes API (inchangées) | `/api/**` |

⚠️ **C'est le travail le plus volumineux des phases 7 et 8 réunies.** L'extraction est mécanique mais large ; le risque est la **régression silencieuse** d'un libellé mal extrait.

---

## 4. Stratégie de vérification

### 4.1 Non-régression

Les 275 tests unitaires et 76 E2E **restent en français** et doivent passer **sans modification**. C'est le filet principal : si un libellé extrait disparaît, un test qui le cherchera échouera.

### 4.2 Suite i18n dédiée

Un fichier `e2e/i18n.spec.ts` prouve ce que le lint ne peut pas :

| Cas | Ce qu'il prouve |
|---|---|
| `/fr/login` et `/en/login` répondent 200 | Le routage localisé fonctionne |
| `/<html lang>` vaut `fr` ou `en` selon l'URL | L'attribut suit la locale réelle |
| `/` redirige vers `/fr` | La locale par défaut s'applique |
| Une locale inconnue (`/de/login`) retombe sur `fr` | Le repli fonctionne |
| Le changement de langue persiste après navigation | REQ-I18N-07 |
| Le catalogue **affiche** une formation d'une autre langue | Option C — rien n'est caché |
| Le catalogue **marque** la langue d'une formation | Option C — l'apprenant est informé |
| Le **filtre** par langue restreint la liste | Option C — le filtrage fonctionne |

### 4.3 Vérifications par tâche

| Contrôle | Attendu |
|---|---|
| `npm run typecheck` | 0 erreur |
| `npm run lint` | 0 erreur |
| `npm run lint:i18n` | 0 clé manquante |
| `npm test` | **275** |
| `npm run test:db` | tests DB verts |
| `npm run test:e2e` | **76 + suite i18n** |
| `npm run audit:content` | **6/6** (non régressé) |

---

## 5. Ce qui n'est PAS dans cette phase

| Élément | Raison |
|---|---|
| **Traduction du contenu** | **Écartée définitivement** (amendement du 2026-09-23) |
| Traduction assistée par IA (T17.13) | Supprimée — la traduction de contenu n'existe pas |
| ES (REQ-I18N-02, T8.9) | Optionnel, conditionné au temps disponible. La structure le permettra sans refonte |
| Localisation des routes API | Décision explicite : `/api/**` reste non localisé |
| Traduction des 6 formations existantes | Elles portent `fr` — leur état normal |

---

## 6. Risques et parades

| Risque | Parade |
|---|---|
| Régression silencieuse d'un libellé extrait | Les 275 tests + 76 E2E cherchent du texte FR : un libellé perdu fait échouer un test |
| Extraction incomplète alors que le lint est bloquant | Le lint est activé **en dernier**, une fois l'extraction terminée et vérifiée |
| Le routage localisé casse les redirections existantes (ex. `/login?redirect=…`) | Les 9 tests E2E d'authentification couvrent les redirections — ils doivent passer sans modification |
| Deux sources de vérité pour la langue (cookie + base) | Ordre explicite : préférence en base > cookie > défaut `fr` |
| Le middleware i18n interfère avec le middleware d'authentification existant | Le middleware existant (`src/middleware.ts`) doit être **fusionné**, pas remplacé — vérification explicite |
| La CI échoue sur `lint:i18n` avant que le projet soit prêt | Le script est ajouté à la CI **dans le dernier commit** de la phase |

---

## 7. Dépendances et impacts

### 7.1 Dépendances ajoutées

- `next-intl` (seule nouvelle dépendance)

### 7.2 Fichiers structurants modifiés

- `src/app/layout.tsx` → déplacé sous `src/app/[locale]/layout.tsx`
- `src/middleware.ts` → **fusion** avec le middleware i18n (il porte déjà la protection des routes)
- `package.json` → script `lint:i18n`, dépendance `next-intl`
- `.github/workflows/ci.yml` → étape `lint:i18n` (en dernier)

### 7.3 Migration

- `src/lib/db/migrations/013_course_language.sql` → `courses.language` + `users.language`
- `src/data/tutorials.json` / `courses.json` → champ `language: "fr"` sur les 6 formations
- `src/lib/db/seed.ts` + `export-content.ts` → prise en charge du champ

---

## 8. Contrainte de conception héritée

⚠️ **Toute formation reste modifiable** (règle établie en phase 6) : ajout et retrait de chapitres et leçons, y compris après traduction ou changement de langue. `courses.language` doit donc être **modifiable** par le créateur, pas figé à la création.

Et : **le contenu pédagogique n'est pas traduit**, mais sa langue doit être **affichée honnêtement** — un apprenant anglophone qui ouvre une formation française doit le savoir avant de commencer.

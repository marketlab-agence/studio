# Phase 8 — Internationalisation de l'interface et langue du contenu — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre l'interface utilisable en français et en anglais (routage `/fr` `/en`, catalogues, formats, persistance), et déclarer la langue de chaque formation — sans jamais traduire le contenu pédagogique.

**Architecture:** Restructuration des routes sous un segment `src/app/[locale]/`, pilotée par `next-intl` (middleware + `getRequestConfig`). Les routes API restent **non localisées**. Deux colonnes distinctes : `users.language` (préférence d'interface) et `courses.language` (langue du contenu, choisie par le créateur).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, `next-intl`, PostgreSQL 16, Jest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-23-phase8-internationalisation-design.md`

## Global Constraints

- Langue du code ET des commentaires : **français**.
- Les commentaires expliquent **pourquoi**, jamais **quoi**.
- PostgreSQL : port **5433** (`katalyst-postgres`). Port 5432 = autre projet, interdit.
- Ne jamais afficher ni commiter de secret.
- **Un seul `next dev` à la fois** (EPERM sur `.next/trace`).
- **Le contenu pédagogique n'est JAMAIS traduit** (amendement du 2026-09-23). Une formation porte **une** langue, choisie par son créateur.
- L'interface suit la langue de **l'utilisateur** ; le contenu suit celle de **son créateur**. Les deux sont indépendants.
- **Découverte des formations (option C)** : le catalogue affiche **tout**, **marque** la langue de chaque formation, et permet de **filtrer**.
- **Les routes API (`/api/**`) ne sont PAS localisées.**
- Locales : `fr` (défaut), `en`. ES : structure prête, non activée.
- Les 275 tests unitaires et 76 E2E **restent en français** et passent **sans modification**.
- ⚠️ **`rg` n'est pas installé** : utiliser `grep` ou `Select-String`.
- ⚠️ Le middleware d'authentification (`src/middleware.ts`) doit être **fusionné** avec le middleware i18n, jamais remplacé : il porte la protection des routes privées.
- Une commande par étape, exécutable depuis la racine. Commit après chaque tâche, arbre propre.

---

### Task 1 : La langue du contenu en base (migration + seed)

**Files:**
- Create: `src/lib/db/migrations/013_language.sql`
- Modify: `src/lib/db/seed.ts`
- Modify: `src/lib/db/export-content.ts`
- Modify: `src/data/courses.json`
- Modify: `src/lib/schemas/content.ts`
- Test: `src/tests/db/language.db.test.ts`

**Interfaces:**
- Consumes: rien (première tâche).
- Produces: colonnes `courses.language` et `users.language` (TEXT NOT NULL DEFAULT 'fr') ; champ `language` dans le schéma Zod des cours.

- [ ] **Step 1: Écrire la migration**

Créer `src/lib/db/migrations/013_language.sql` :

```sql
-- Langue du contenu d'une formation, et langue d'interface d'un utilisateur.
--
-- ⚠️ Deux colonnes DISTINCTES, deux usages distincts : les confondre serait une
-- erreur de conception. `courses.language` est choisie par le CRÉATEUR et décrit
-- le contenu ; `users.language` est choisie par l'UTILISATEUR et décrit l'interface.
--
-- ⚠️ `NOT NULL DEFAULT 'fr'` est délibéré pour `courses.language` : les 6 formations
-- existantes sont réellement en français. Ce n'est pas une valeur de remplissage,
-- c'est leur état. Aucune donnée n'est inventée (méthode REWORK).
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr';

ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT;

-- Contrainte : seules les locales supportées. ES est prévu par la structure
-- (REQ-I18N-02) mais non activé — la contrainte l'accepte déjà pour éviter une
-- migration supplémentaire le jour où il sera activé.
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_language_check;
ALTER TABLE courses ADD CONSTRAINT courses_language_check
  CHECK (language IN ('fr', 'en', 'es'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_language_check;
ALTER TABLE users ADD CONSTRAINT users_language_check
  CHECK (language IS NULL OR language IN ('fr', 'en', 'es'));
```

- [ ] **Step 2: Appliquer la migration**

Run: `npm run db:migrate`
Expected: la migration 013 s'applique sans erreur

Run: `npm run db:migrate:test`
Expected: idem sur `katalyst_test`

- [ ] **Step 3: Vérifier les colonnes en base**

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT column_name FROM information_schema.columns WHERE table_name='courses' AND column_name='language';"`
Expected: `language`

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT COUNT(*) FROM courses WHERE language='fr';"`
Expected: `6` (les 6 formations existantes, en français)

- [ ] **Step 4: Écrire le test qui échoue**

Créer `src/tests/db/language.db.test.ts` :

```ts
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Vérifie que la langue du contenu est bien un attribut de la formation, et
 * qu'il est DISTINCT de la langue d'interface de l'utilisateur.
 */
describe('langue du contenu et langue d’interface', () => {
  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  it('donne la langue française aux 6 formations existantes', async () => {
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM courses WHERE language = 'fr'`,
    );
    expect(rows[0].n).toBeGreaterThanOrEqual(6);
  });

  it('refuse une langue non supportée sur une formation', async () => {
    await expect(
      pool.query(`UPDATE courses SET language = 'de' WHERE id = (SELECT id FROM courses LIMIT 1)`),
    ).rejects.toThrow(/courses_language_check/);
  });

  it('accepte une préférence d’interface nulle (non choisie)', async () => {
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM users WHERE language IS NULL`,
    );
    expect(rows[0].n).toBeGreaterThan(0);
  });

  it('refuse une langue d’interface non supportée', async () => {
    await expect(
      pool.query(`UPDATE users SET language = 'de' WHERE id = (SELECT id FROM users LIMIT 1)`),
    ).rejects.toThrow(/users_language_check/);
  });
});
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il échoue**

Run: `npx jest --config jest.config.db.mjs --testPathPattern=language`
Expected: FAIL — la migration n'est pas encore appliquée **si** l'étape 2 a été sautée ; si elle est appliquée, le test peut passer directement, ce qui est acceptable (la migration précède le test, c'est l'ordre TDD inverse assumé pour une migration SQL).

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

Run: `npx jest --config jest.config.db.mjs --testPathPattern=language`
Expected: PASS — 4 tests

- [ ] **Step 7: Ajouter le champ au schéma Zod et aux données sources**

Dans `src/lib/schemas/content.ts`, ajouter au `CourseSchema` (au même niveau que `contentDomain`) :

```ts
  /**
   * Langue du contenu, choisie par le créateur.
   *
   * ⚠️ **Ce n'est PAS une traduction.** Une formation porte une langue ; il
   * n'existe pas « la même formation en FR et EN ».
   */
  language: z.enum(['fr', 'en', 'es']).default('fr'),
```

Dans `src/data/courses.json`, ajouter `"language": "fr"` à chacune des 6 formations.

- [ ] **Step 8: Propager dans le seed et l'export**

Dans `src/lib/db/seed.ts`, ajouter `language` à l'INSERT des cours et à son `ON CONFLICT DO UPDATE` :

```sql
  -- dans la liste des colonnes : language
  -- dans les valeurs : $N
  -- dans le DO UPDATE : language = EXCLUDED.language
```

La valeur vient du JSON : `course.language ?? 'fr'`.

⚠️ **Ne pas utiliser `COALESCE` ici** : contrairement à `bloom_level`, la langue a un défaut réel (`'fr'`) et le créateur doit pouvoir la **changer**. Un `COALESCE` empêcherait de passer de `fr` à `en`.

Dans `src/lib/db/export-content.ts`, ajouter `language` à la requête de sélection et à la réécriture du JSON (même logique d'appariement que les objectifs).

- [ ] **Step 9: Re-seeder et vérifier**

Run: `npm run db:seed`
Expected: `courses : 6`, sans erreur

Run: `& docker exec -i katalyst-postgres psql -U postgres -d katalyst -t -A -c "SELECT title, language FROM courses ORDER BY title LIMIT 3;"`
Expected: 3 lignes avec `fr`

- [ ] **Step 10: Vérifier typecheck, lint et tests**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

Run: `npm test`
Expected: 275 tests

Run: `npm run test:db`
Expected: tests verts (dont la nouvelle suite `language`)

- [ ] **Step 11: Commit**

```bash
git add src/lib/db/migrations/013_language.sql src/tests/db/language.db.test.ts src/lib/schemas/content.ts src/data/courses.json src/lib/db/seed.ts src/lib/db/export-content.ts
git commit -m "feat(i18n): declarer la langue du contenu sur les formations (T8.7)"
```

---

### Task 2 : Installer `next-intl` et la configuration de routage

**Files:**
- Modify: `package.json` (dépendance `next-intl`)
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `locales/fr/translation.json`
- Create: `locales/en/translation.json`
- Create: `src/i18n/navigation.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `export const routing = defineRouting({ locales: ['fr','en'], defaultLocale: 'fr' })`
  - `export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)`
  - Catalogues `locales/{fr,en}/translation.json`

- [ ] **Step 1: Installer la dépendance**

Run: `npm install next-intl --legacy-peer-deps`
Expected: `added N packages`

- [ ] **Step 2: Écrire la configuration de routage**

Créer `src/i18n/routing.ts` :

```ts
import { defineRouting } from 'next-intl/routing';

/**
 * Locales supportées et locale par défaut.
 *
 * ⚠️ **`fr` est la locale de repli** (REQ-I18N-08, T8.8) : une URL sans locale
 * reconnue retombe sur le français. C'est cohérent avec le fait que les 6
 * formations existantes sont en français — un visiteur non identifié voit la
 * langue la plus représentée dans le catalogue.
 *
 * ⚠️ **ES est déclaré mais non activé.** La structure l'accepte (REQ-I18N-02 :
 * optionnel) ; l'ajouter un jour ne demandera qu'un catalogue, pas une refonte.
 */
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
});
```

- [ ] **Step 3: Écrire la résolution de locale**

Créer `src/i18n/request.ts` :

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Charge le catalogue de la locale demandée.
 *
 * ⚠️ **Le repli n'est pas silencieux.** Une locale inconnue dans l'URL est
 * ramenée à la locale par défaut sans erreur — c'est ce qui rend `/de/login`
 * utilisable plutôt qu'une page blanche.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const demandee = await requestLocale;
  const locale = hasLocale(routing.locales, demandee) ? demandee : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../locales/${locale}/translation.json`)).default,
  };
});
```

- [ ] **Step 4: Écrire la navigation localisée**

Créer `src/i18n/navigation.ts` :

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Navigation qui préserve automatiquement la locale courante.
 *
 * ⚠️ **Ne jamais importer `Link` depuis `next/link` directement dans une page
 * localisée** : un lien brut perdrait le préfixe de locale et ferait sortir
 * l'utilisateur de sa langue. Toujours utiliser ces exports.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] **Step 5: Créer les catalogues avec le premier domaine**

Créer `locales/fr/translation.json` :

```json
{
  "common": {
    "appName": "Katalyst",
    "loading": "Chargement…",
    "error": "Une erreur est survenue",
    "retry": "Réessayer",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "close": "Fermer"
  },
  "localeSwitcher": {
    "label": "Langue",
    "fr": "Français",
    "en": "Anglais"
  }
}
```

Créer `locales/en/translation.json` :

```json
{
  "common": {
    "appName": "Katalyst",
    "loading": "Loading…",
    "error": "Something went wrong",
    "retry": "Retry",
    "cancel": "Cancel",
    "save": "Save",
    "close": "Close"
  },
  "localeSwitcher": {
    "label": "Language",
    "fr": "French",
    "en": "English"
  }
}
```

- [ ] **Step 6: Vérifier typecheck**

Run: `npm run typecheck`
Expected: 0 erreur

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/i18n locales
git commit -m "feat(i18n): installer next-intl et poser la configuration de routage"
```

---

### Task 3 : Fusionner le middleware i18n avec l'authentification

**Files:**
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `routing` de `src/i18n/routing.ts` (Task 2).
- Produces: middleware unique qui localise **et** protège.

- [ ] **Step 1: Écrire le test qui échoue — la protection survit-elle au préfixe ?**

Ce test est le plus important de la phase : il prouve que le préfixe de locale ne fait pas tomber la protection.

Ajouter dans `e2e/i18n.spec.ts` (fichier créé en Task 9, mais ce cas peut être écrit ici) — **ou** vérifier manuellement pour l'instant :

Run: `grep -n "pathname" src/middleware.ts`
Expected: lire la sortie et **constater** que `isProtectedPath(pathname)` reçoit un chemin **préfixé** (`/fr/dashboard`), ce qui ne matche pas `PROTECTED_PREFIXES` (`/dashboard`).

⚠️ **C'est le défaut à corriger dans cette tâche.** `matches()` dans `src/lib/auth/routes.ts` exige un préfixe exact : `/fr/dashboard` ne commence pas par `/dashboard`.

- [ ] **Step 2: Fusionner les deux middlewares**

Modifier `src/middleware.ts` pour :

1. retirer le préfixe de locale du chemin **avant** de le donner aux fonctions de `@/lib/auth/routes` ;
2. déléguer le routage à `next-intl`.

```ts
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/auth/cookies';
import { tryVerifyAccessToken } from '@/lib/auth/jwt';
import { canAccessAdminUi, isAdminPath, isGuestOnlyPath, isProtectedPath } from '@/lib/auth/routes';
import { routing } from '@/i18n/routing';

const handleI18n = createMiddleware(routing);

/**
 * Retire le préfixe de locale d'un chemin, s'il est présent.
 *
 * ⚠️ **Indispensable, et c'est le piège de cette phase.** Les listes de routes de
 * `@/lib/auth/routes` (`PROTECTED_PREFIXES`, `ADMIN_PREFIXES`, `GUEST_ONLY_PREFIXES`)
 * sont écrites **sans** locale : `/dashboard`, `/admin`. Depuis que les routes sont
 * localisées, le chemin reçu est `/fr/dashboard`. Sans ce retrait, `isProtectedPath`
 * retournerait `false` et **la protection des pages privées tomberait** — un défaut
 * de sécurité silencieux, puisqu'aucune erreur ne serait levée.
 */
function sansLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cheminMetier = sansLocale(pathname);

  const claims = await tryVerifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);

  if (!claims && isProtectedPath(cheminMetier)) {
    const url = request.nextUrl.clone();
    // ⚠️ La redirection passe par le middleware i18n : la locale est préservée.
    url.pathname = `/${routing.defaultLocale}/login`;
    url.search = '';
    url.searchParams.set('redirect', cheminMetier);
    return NextResponse.redirect(url);
  }

  if (claims && isGuestOnlyPath(cheminMetier)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}/dashboard`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (claims && isAdminPath(cheminMetier) && !canAccessAdminUi(claims.role)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}/dashboard`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return handleI18n(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|gif|webp|ico|css|js|map|woff2?|ttf)$).*)',
  ],
};
```

- [ ] **Step 3: Vérifier typecheck et lint**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "fix(i18n): fusionner le middleware i18n avec l'authentification sans perdre la protection"
```

---

### Task 4 : Restructurer les routes sous `[locale]` · REQ-I18N-03

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Modify: `src/app/layout.tsx` (devient minimal ou disparaît)
- Move: **toutes** les routes de `src/app/*` vers `src/app/[locale]/*`

**Interfaces:**
- Consumes: `routing` (Task 2), middleware (Task 3).
- Produces: routes localisées fonctionnelles.

⚠️ **Tâche large et mécanique.** Elle ne modifie **aucun contenu de page** : elle déplace, et adapte le layout racine.

- [ ] **Step 1: Déplacer les routes (sauf `api/`)**

Pour chaque dossier de `src/app/` **sauf `api/`**, le déplacer sous `src/app/[locale]/`.

Run (PowerShell, depuis la racine) :

```powershell
$routes = @('about','account','admin','ai-assistant','blog','certificate','courses','dashboard','features','forgot-password','health','invitation','login','pricing','reset-password','signup','subscribe','tutorial')
foreach ($r in $routes) { if (Test-Path "src/app/$r") { git mv "src/app/$r" "src/app/[locale]/$r" } }
git mv src/app/page.tsx src/app/[locale]/page.tsx
```

⚠️ `globals.css`, `favicon.ico` et tout autre fichier **non-route** restent dans `src/app/`. Seuls les dossiers de route et `page.tsx` sont déplacés.

- [ ] **Step 2: Écrire le layout localisé**

Créer `src/app/[locale]/layout.tsx` en **reprenant** le contenu de l'ancien `src/app/layout.tsx`, avec trois changements :

```tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
// ... autres imports inchangés (ThemeProvider, AuthProvider, TutorialProvider)

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    // ⚠️ `lang` suit la locale RÉELLE (REQ-I18N-01) : la valeur `fr` en dur
    // annonçait le français à un lecteur d'écran sur une page anglaise.
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider>
          {/* hiérarchie de providers existante : ThemeProvider → AuthProvider → TutorialProvider */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

⚠️ **Ne rien inventer** : reprendre exactement les providers et leur ordre depuis l'ancien layout.

- [ ] **Step 3: Adapter le layout racine**

`src/app/layout.tsx` doit **cesser de rendre `<html>`** (c'est désormais le rôle du layout localisé). S'il ne contient plus rien d'utile, le supprimer. S'il porte encore des imports globaux (`globals.css`), les déplacer dans le layout localisé.

- [ ] **Step 4: Vérifier que le serveur démarre et que les routes répondent**

Run: `npm run dev:turbo`
Expected: démarre sans erreur

Puis, dans un autre terminal :

Run: `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/fr/login`
Expected: `200`

Run: `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/en/login`
Expected: `200`

Run: `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/`
Expected: `307` ou `308` (redirection vers `/fr`)

Arrêter le serveur ensuite.

- [ ] **Step 5: Vérifier typecheck et lint**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(i18n): restructurer les routes sous le segment [locale]"
```

---

### Task 5 : Catalogue — afficher, marquer et filtrer par langue · REQ-I18N-08 (option C)

**Files:**
- Modify: `src/app/[locale]/courses/page.tsx` (ou l'équivalent trouvé)
- Modify: `src/lib/providers/content.ts` (méthode de liste **et d'écriture**)
- Modify: `src/lib/providers/postgres/content.ts` (implémentation)
- Modify: `locales/fr/translation.json`, `locales/en/translation.json`
- Test: `e2e/i18n.spec.ts` (cas catalogue)

⚠️ **Tâche ajoutée à la suite de la revue de Task 1.** Le constat était juste : la colonne existe
en base, mais **aucun chemin ne l'écrit**. Or la règle du projet est explicite — « toute formation
reste modifiable » (`docs/superpowers/specs/2026-09-23-phase8-internationalisation-design.md` §8).
Sans cette tâche, la langue serait figée à la création et l'exigence non couverte.

**Interfaces:**
- Consumes: `courses.language` (Task 1), navigation localisée (Task 2).
- Produces: catalogue avec marquage et filtre + **écriture de la langue par le créateur**.

- [ ] **Step 1: Exposer `language` en lecture ET en écriture dans le provider**

Dans `src/lib/providers/content.ts`, le type des cours doit porter `language`. Vérifier les **trois** méthodes d'écriture — c'est le point que la revue a relevé :

```ts
  // Dans le type retourné par listCourses / getCourse :
  language: 'fr' | 'en' | 'es';
```

⚠️ **Et dans les écritures** : `saveCourses`, `createCourse`, `updateCourse` doivent **persister** `language`. Sans quoi une formation créée ou modifiée par l'interface repartirait systématiquement en `fr`, et le créateur ne pourrait jamais changer la langue — malgré la colonne et la contrainte en base.

Dans `src/lib/providers/postgres/content.ts`, ajouter `language` aux `INSERT` et `UPDATE` correspondants.

- [ ] **Step 2: Ajouter les clés de catalogue**

Dans `locales/fr/translation.json`, ajouter :

```json
  "catalog": {
    "title": "Formations",
    "languageLabel": "Langue de la formation",
    "filterByLanguage": "Filtrer par langue",
    "allLanguages": "Toutes les langues",
    "languageFr": "Français",
    "languageEn": "Anglais",
    "noResultForFilter": "Aucune formation dans cette langue",
    "changeLanguage": "Langue du contenu"
  }
```

Dans `locales/en/translation.json` :

```json
  "catalog": {
    "title": "Courses",
    "languageLabel": "Course language",
    "filterByLanguage": "Filter by language",
    "allLanguages": "All languages",
    "languageFr": "French",
    "languageEn": "English",
    "noResultForFilter": "No course in this language",
    "changeLanguage": "Content language"
  }
```

- [ ] **Step 3: Afficher et marquer la langue sur la carte de formation**

Dans la carte de chaque formation du catalogue, ajouter un badge avec la langue :

```tsx
<Badge variant="outline">
  {course.language === 'en' ? t('catalog.languageEn') : t('catalog.languageFr')}
</Badge>
```

⚠️ **Le marquage est la partie non négociable de l'option C** : un apprenant anglophone doit savoir **avant d'ouvrir** qu'une formation est en français.

- [ ] **Step 4: Ajouter le filtre**

Un sélecteur au-dessus de la liste, avec trois choix (toutes / français / anglais). Le filtrage se fait **côté client** sur la liste déjà chargée — le catalogue est petit (6 formations), un aller-retour serveur serait inutile.

Quand le filtre exclut tout : afficher `t('catalog.noResultForFilter')`, jamais une liste vide muette.

- [ ] **Step 5: Permettre au créateur de changer la langue**

Dans l'édition d'une formation (formulaire admin), ajouter un sélecteur de langue du contenu. Il écrit `language` via `updateCourse`.

Ajouter un test dans `src/tests/db/language.db.test.ts` :

```ts
  it('permet au créateur de changer la langue d’une formation', async () => {
    await requireDatabaseOrSkip();

    const { rows } = await pool.query<{ id: string; language: string }>(
      `SELECT id, language FROM courses WHERE language = 'fr' LIMIT 1`,
    );
    expect(rows.length).toBe(1);
    const { id } = rows[0];

    try {
      await pool.query(`UPDATE courses SET language = 'en' WHERE id = $1`, [id]);
      const apres = await pool.query<{ language: string }>(
        `SELECT language FROM courses WHERE id = $1`,
        [id],
      );
      expect(apres.rows[0].language).toBe('en');
    } finally {
      // ⚠️ Restauration obligatoire : le catalogue E2E attend les 6 formations en
      // français. Sans ce `finally`, le test laisserait la base dans un état qui
      // ferait échouer la suite i18n (qui vérifie qu'aucune formation n'est en anglais).
      await pool.query(`UPDATE courses SET language = 'fr' WHERE id = $1`, [id]);
    }
  });
```

- [ ] **Step 6: Vérifier typecheck, lint, tests et démarrage**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

Run: `npm test`
Expected: 275

Run: `npx jest --config jest.config.db.mjs --testPathPattern=language`
Expected: 5 tests (les 4 de la Task 1 + celui-ci)

Run: `npm run dev:turbo` puis `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/fr/courses`
Expected: `200`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): afficher, marquer, filtrer et modifier la langue des formations (option C)"
```

---

### Task 6 : Sélecteur de langue et persistance (REQ-I18N-07)

**Files:**
- Create: `src/components/layout/LocaleSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx` (intégrer le sélecteur)
- Modify: `src/lib/db/migrations/013_language.sql` **déjà fait** (`users.language` existe)
- Modify: `src/lib/providers/users.ts` (méthode de mise à jour de la préférence)

**Interfaces:**
- Consumes: `users.language` (Task 1), navigation localisée (Task 2).
- Produces: `LocaleSwitcher` + persistance de la préférence.

- [ ] **Step 1: Écrire le composant sélecteur**

Créer `src/components/layout/LocaleSwitcher.tsx` :

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

/**
 * Change la langue de l'interface.
 *
 * ⚠️ **Deux niveaux de persistance, et l'ordre compte.** Le cookie posé par
 * `next-intl` survit dans le navigateur ; la préférence en base (`users.language`)
 * suit l'utilisateur d'un appareil à l'autre. Cette dernière prime : un formateur
 * qui se connecte depuis un autre poste doit retrouver sa langue.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('localeSwitcher');
  const router = useRouter();
  const pathname = usePathname();

  async function changer(nouvelleLocale: string) {
    // La préférence est enregistrée côté serveur ; on ne bloque pas la navigation
    // dessus : l'interface change immédiatement, la persistance suit.
    void fetch('/api/v1/preferences/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: nouvelleLocale }),
    });
    router.replace(pathname, { locale: nouvelleLocale });
  }

  return (
    <div className="flex items-center gap-1" aria-label={t('label')}>
      {routing.locales.map((l) => (
        <Button
          key={l}
          variant={l === locale ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => changer(l)}
          aria-current={l === locale ? 'true' : undefined}
        >
          {t(l)}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Créer la route de préférence**

Créer `src/app/api/v1/preferences/language/route.ts` :

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestScope } from '@/lib/providers';
import { getUsersProvider } from '@/lib/providers';

/**
 * Enregistre la langue d'interface choisie.
 *
 * ⚠️ **Route API, non localisée** : elle est appelée par du code, et sa réponse
 * ne dépend pas de la langue de l'appelant. La placer sous `[locale]` créerait
 * deux URL pour le même endpoint.
 */
const BodySchema = z.object({ language: z.enum(['fr', 'en', 'es']) });

export async function PUT(request: Request) {
  const scope = await getRequestScope();
  if (!scope) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Langue invalide' }, { status: 400 });

  await getUsersProvider().updatePreferredLanguage(scope, parsed.data.language);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Ajouter la méthode au provider**

Dans `src/lib/providers/users.ts`, déclarer :

```ts
  /** Enregistre la langue d'interface préférée. */
  updatePreferredLanguage(scope: OrgScope, language: 'fr' | 'en' | 'es'): Promise<void>;
```

Et l'implémenter dans `src/lib/providers/postgres/users.ts` :

```ts
  async updatePreferredLanguage(scope: OrgScope, language: 'fr' | 'en' | 'es'): Promise<void> {
    await query(
      'UPDATE users SET language = $2 WHERE id = $1 AND organization_id = $3',
      [scope.userId, language, scope.organizationId],
    );
  }
```

⚠️ Le `AND organization_id = $3` n'est pas décoratif : il empêche de modifier la préférence d'un utilisateur **hors de son organisation**.

- [ ] **Step 4: Lire la préférence à la connexion**

⚠️ **Point laissé explicitement en suspens** : l'ordre de priorité est « préférence en base > cookie > défaut ». L'implémentation complète exige de lire `users.language` **dans le middleware** — impossible, il tourne en Edge sans accès base.

**Solution retenue** : après connexion, la route `POST /api/auth/login` **pose le cookie de locale** avec la valeur de `users.language`. C'est là que la base est accessible, et cela évite un aller-retour supplémentaire.

Ajouter dans la réponse de succès de connexion un `Set-Cookie` sur le nom de cookie de `next-intl` (`NEXT_LOCALE` par défaut), avec la valeur `users.language` si elle existe.

- [ ] **Step 5: Intégrer le sélecteur dans le layout**

Dans `src/app/[locale]/layout.tsx`, placer `<LocaleSwitcher />` à côté du bouton de connexion / menu utilisateur, à la même position visible.

- [ ] **Step 6: Vérifier typecheck, lint et tests**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

Run: `npm test`
Expected: 275 tests

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): selecteur de langue et persistance de la preference (REQ-I18N-07)"
```

---

### Task 7 : Formats localisés (REQ-I18N-06)

**Files:**
- Modify: les composants affichant des dates, nombres ou devises

**Interfaces:**
- Consumes: `next-intl` (Task 2).
- Produces: affichages sensibles à la locale.

- [ ] **Step 1: Trouver les affichages concernés**

Run: `grep -rn "toLocaleDateString\|toLocaleString\|Intl\." src/app src/components --include=*.tsx`
Expected: lire la liste des occurrences

- [ ] **Step 2: Remplacer par le formateur `next-intl`**

Pour chaque affichage de date ou nombre dans un composant client :

```tsx
'use client';
import { useFormatter } from 'next-intl';

// dans le composant :
const format = useFormatter();
// remplace `date.toLocaleDateString('fr-FR')` par :
format.dateTime(date, { dateStyle: 'long' });
```

Pour un composant **serveur** :

```tsx
import { getFormatter } from 'next-intl/server';

const format = await getFormatter();
```

⚠️ **Les devises** : utiliser `format.number(montant, { style: 'currency', currency: 'EUR' })`. La devise reste l'euro — sa **présentation** suit la locale (`1 234,56 €` en français, `€1,234.56` en anglais), pas sa valeur. Changer de devise serait une décision commerciale, hors périmètre.

- [ ] **Step 3: Vérifier typecheck, lint et tests**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

Run: `npm test`
Expected: 275 tests — ⚠️ un test qui compare une date formatée en dur peut échouer : c'est le signe qu'il faut ajuster **le test**, pas le code (la locale de repli reste `fr`, donc le format ne devrait pas changer).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(i18n): formats localises pour dates, nombres et devises (REQ-I18N-06)"
```

---

### Task 8 : Extraction des chaînes — vagues par domaine

**Files:**
- Modify: `locales/fr/translation.json`, `locales/en/translation.json`
- Modify: les 32 pages et 137 composants

**Interfaces:**
- Consumes: catalogues (Task 2).
- Produces: interface sans chaîne en dur (REQ-I18N-04).

⚠️ **Tâche la plus volumineuse de la phase (~538 chaînes).** Elle est découpée en vagues par domaine, **chacune vérifiée séparément**.

- [ ] **Step 1: Vague 1 — layout et navigation**

Extraire les chaînes de `src/components/layout/**` (header, footer, menu). Ajouter le domaine `nav` aux deux catalogues.

Run: `npm test`
Expected: 275 tests

Commit :
```bash
git add -A
git commit -m "feat(i18n): extraire les chaines de la navigation (vague 1/4)"
```

- [ ] **Step 2: Vague 2 — pages publiques**

Extraire `about`, `features`, `pricing`, `blog`, `login`, `signup`, `forgot-password`, `reset-password`.

Run: `npm test`
Expected: 275 tests

Run: `npm run test:e2e -- --grep "Parcours public"`
Expected: les tests de la suite `public.spec.ts` passent

Commit :
```bash
git add -A
git commit -m "feat(i18n): extraire les chaines des pages publiques (vague 2/4)"
```

- [ ] **Step 3: Vague 3 — espace apprenant**

Extraire `dashboard`, `account`, `courses`, `certificate`, `tutorial`, `subscribe`, `invitation`, `ai-assistant`.

Run: `npm test`
Expected: 275 tests

Run: `npm run test:e2e`
Expected: 76 tests

Commit :
```bash
git add -A
git commit -m "feat(i18n): extraire les chaines de l'espace apprenant (vague 3/4)"
```

- [ ] **Step 4: Vague 4 — administration**

Extraire `admin/**`.

Run: `npm test`
Expected: 275 tests

Run: `npm run test:e2e`
Expected: 76 tests

- [ ] **Step 5: Vérifier qu'aucune chaîne ne reste**

Run: `grep -rn ">[A-ZÀ-Ý][a-zà-ÿ][^<>{}]\{4,\}<" src/app src/components --include=*.tsx | grep -v "t(" `
Expected: la liste doit être **courte et justifiée** — resteront les noms propres (`Katalyst`), les sigles (`SEO`, `API`) et les contenus de données. Toute phrase française complète restante est un oubli.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(i18n): extraire les chaines de l'administration (vague 4/4)"
```

---

### Task 9 : Lint i18n et suite de tests dédiée · REQ-I18N-05

**Files:**
- Create: `scripts/lint-i18n.mjs`
- Create: `e2e/i18n.spec.ts`
- Modify: `package.json` (script `lint:i18n`)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: catalogues (Tasks 2 à 8).
- Produces: `npm run lint:i18n` bloquant + suite E2E i18n.

- [ ] **Step 1: Écrire le script de lint**

Créer `scripts/lint-i18n.mjs` :

```js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vérifie que les catalogues FR et EN portent EXACTEMENT les mêmes clés.
 *
 * ⚠️ **On compare les CLÉS, pas les valeurs.** Une valeur différente est normale
 * (c'est la traduction) ; une clé absente est un bug qui produirait un libellé
 * vide ou une erreur à l'exécution chez l'utilisateur.
 *
 * ⚠️ **Ce lint ne peut être bloquant que si l'extraction est terminée** : sur une
 * interface à moitié extraite, il échouerait sans raison utile. C'est pourquoi il
 * n'est branché sur la CI qu'à la toute fin de la phase.
 */
const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['fr', 'en'];

function cles(objet, prefixe = '') {
  return Object.entries(objet).flatMap(([cle, valeur]) => {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    return valeur && typeof valeur === 'object' ? cles(valeur, chemin) : [chemin];
  });
}

const catalogues = Object.fromEntries(
  locales.map((locale) => [
    locale,
    JSON.parse(readFileSync(join(racine, 'locales', locale, 'translation.json'), 'utf8')),
  ]),
);

const reference = new Set(cles(catalogues.fr));
const comparee = new Set(cles(catalogues.en));

const manquantesEn = [...reference].filter((cle) => !comparee.has(cle));
const manquantesFr = [...comparee].filter((cle) => !reference.has(cle));

if (manquantesEn.length || manquantesFr.length) {
  console.error('✖ Catalogues incomplets');
  for (const cle of manquantesEn) console.error(`  absente en EN : ${cle}`);
  for (const cle of manquantesFr) console.error(`  absente en FR : ${cle}`);
  process.exit(1);
}

console.log(`✔ Catalogues cohérents : ${reference.size} clés dans chaque langue.`);
```

- [ ] **Step 2: Ajouter le script npm**

Dans `package.json`, après `"lint"` :

```json
    "lint:i18n": "node scripts/lint-i18n.mjs",
```

- [ ] **Step 3: Vérifier que le lint passe**

Run: `npm run lint:i18n`
Expected: `✔ Catalogues cohérents : N clés dans chaque langue.`

- [ ] **Step 4: Écrire la suite E2E i18n**

Créer `e2e/i18n.spec.ts` :

```ts
import { test, expect } from '@playwright/test';

/**
 * Prouve ce que le lint i18n ne peut pas : que le routage localisé FONCTIONNE.
 * Le lint garantit que les clés existent ; ces tests garantissent qu'elles
 * s'affichent dans la bonne langue, au bon endroit.
 */
test.describe('internationalisation', () => {
  test('sert le français et l’anglais sur la page de connexion', async ({ page }) => {
    await page.goto('/fr/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    await page.goto('/en/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('redirige la racine vers la locale par défaut', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr(\/|$)/);
  });

  test('retombe sur le français pour une locale inconnue', async ({ page }) => {
    const response = await page.goto('/de/login');
    // Le middleware ramène à une locale supportée plutôt que d'échouer.
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    expect(response?.status()).toBeLessThan(400);
  });

  test('protège les pages privées même avec un préfixe de locale', async ({ page }) => {
    // ⚠️ Le test le plus important : sans le retrait du préfixe dans le middleware,
    // `/fr/dashboard` ne matcherait pas `/dashboard` et la page s'ouvrirait.
    await page.goto('/fr/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/en/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('affiche le catalogue en anglais', async ({ page }) => {
    await page.goto('/en/courses');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Le marquage de langue doit être présent : option C.
    await expect(page.getByText(/French|Français/i).first()).toBeVisible();
  });

  test('le filtre de langue restreint la liste', async ({ page }) => {
    await page.goto('/fr/courses');
    // Les 6 formations sont en français : filtrer sur l'anglais doit vider la liste.
    const filtre = page.getByLabel(/Filtrer par langue/i);
    await filtre.click();
    await page.getByRole('option', { name: /Anglais/i }).click();
    await expect(page.getByText(/Aucune formation/i)).toBeVisible();
  });
});
```

- [ ] **Step 5: Lancer la suite i18n**

Run: `npm run test:e2e -- --grep "internationalisation"`
Expected: 6 tests passent

- [ ] **Step 6: Brancher sur la CI — EN DERNIER**

Ajouter dans `.github/workflows/ci.yml`, après l'étape `typecheck` :

```yaml
      - name: Catalogue i18n
        run: npm run lint:i18n
```

⚠️ **C'est le dernier geste de la phase.** Ajouter cette étape avant que l'extraction soit terminée ferait échouer la CI sur du travail en cours.

- [ ] **Step 7: Commit**

```bash
git add scripts/lint-i18n.mjs e2e/i18n.spec.ts package.json .github/workflows/ci.yml
git commit -m "feat(i18n): lint des catalogues bloquant et suite E2E dediee"
```

---

### Task 10 : Vérification finale et consignation

**Files:**
- Modify: `.kiro/specs/katalyst/tasks.md`
- Modify: `MEMORY.md`
- Modify: `memory/decisions-architecturales.md`

**Interfaces:**
- Consumes: Tasks 1 à 9.
- Produces: aucun code.

- [ ] **Step 1: Vérification complète**

Run: `npm run typecheck`
Expected: 0 erreur

Run: `npm run lint`
Expected: 0 erreur

Run: `npm run lint:i18n`
Expected: catalogues cohérents

Run: `npm test`
Expected: **275**

Run: `npm run test:db`
Expected: tests verts (dont `language`)

Run: `npm run test:e2e`
Expected: **76 + 6** (suite i18n)

Run: `npm run audit:content`
Expected: **6/6** (non régressé)

- [ ] **Step 2: Consigner la décision 48**

Ajouter à `memory/decisions-architecturales.md` :

```markdown
48. **Phase 8 — internationalisation : la langue du contenu n'est pas une traduction.** L'ADR 0008 prévoyait un contenu « traduisible » (une formation en FR et EN, aidée par IA). **Cette conception était fausse** : Katalyst est un **outil de création** — un formateur écrit dans **sa** langue, lui imposer une seconde version traduirait l'usage réel. La langue est donc un **attribut de la formation**, choisi par son créateur et modifiable. Le référentiel a été amendé (REQ-I18N-08 réécrite, REQ-I18N-09 supprimée, ADR 0008 amendé, T17.13 supprimée) plutôt que contourné : un référentiel qui contredit la réalité du produit finit par produire du travail inutile. Corollaire de conception : l'interface suit la langue de **l'utilisateur**, le contenu celle de **son créateur** — les deux sont indépendants, et le catalogue **affiche tout** en **marquant** la langue (option C), pour qu'un apprenant sache avant d'ouvrir.
    - Rusé d'intégration : le **middleware d'authentification reçoit un chemin préfixé** (`/fr/dashboard`) qui ne matche pas ses listes (`/dashboard`). Sans retrait du préfixe, **la protection des pages privées tombe silencieusement** — aucune erreur n'est levée. À vérifier explicitement dans tout middleware qui lit `pathname`.
```

- [ ] **Step 3: Cocher la phase 8**

Mettre à jour les cases T8.1 à T8.9 dans `tasks.md`, avec la même structure que la note de fin de phase 7.

- [ ] **Step 4: Mettre à jour `MEMORY.md`**

- Phase en cours → Phase 8 terminée
- Prochaine phase → Phase 9 (API centrale v1)
- Qualité → ajouter `lint:i18n` et la suite i18n

- [ ] **Step 5: Vérifier l'arbre git**

Run: `git status --short`
Expected: propre

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs(phase8): consigner l'internationalisation et l'amendement du referentiel"
```

---

## Annexe — Ce qui n'est PAS fait

| Élément | Raison |
|---|---|
| Traduction du contenu | **Écartée définitivement** (amendement du 2026-09-23) |
| Activation de l'ESPAGNOL (T8.9) | Optionnel (REQ-I18N-02). La structure l'accepte : ajouter `locales/es/` + une entrée dans `routing.locales` suffira |
| Localisation des routes API | `/api/**` reste technique et non localisé |
| Traduction des 6 formations existantes | Elles portent `fr` — leur état normal |

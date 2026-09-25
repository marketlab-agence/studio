/**
 * @jest-environment node
 *
 * La protection des pages privées survit-elle au préfixe de locale ? (T8.3)
 *
 * ⚠️ C'est le test le plus important de la phase : il fige le défaut invisible.
 * Les listes de `@/lib/auth/routes` sont écrites **sans** locale (`/dashboard`).
 * Depuis la localisation, le chemin reçu est `/fr/dashboard` ; sans le retrait du
 * préfixe, `isProtectedPath` retourne `false` et la protection tombe **sans
 * erreur**. Ces assertions échoueraient si `sansLocale` régressait.
 *
 * `next-intl` est publié en ESM seul : il est mocké ici pour que Jest (CJS) puisse
 * charger `@/middleware`. Le mock de `@/i18n/routing` reprend la configuration
 * **réelle** (`fr`, `en`), de sorte que `sansLocale` est bien exercé avec les
 * locales de production.
 */
jest.mock('next-intl/middleware', () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock('@/i18n/routing', () => ({
  routing: { locales: ['fr', 'en'], defaultLocale: 'fr', localePrefix: 'always' },
}));

import { isProtectedPath } from '@/lib/auth/routes';
import { sansLocale } from '@/middleware';

describe('sansLocale — retrait du préfixe de locale', () => {
  it('retire un préfixe de locale connu', () => {
    expect(sansLocale('/fr/dashboard')).toBe('/dashboard');
    expect(sansLocale('/en/admin')).toBe('/admin');
    expect(sansLocale('/en/admin/courses')).toBe('/admin/courses');
  });

  it('ramène une racine localisée à la racine', () => {
    expect(sansLocale('/fr')).toBe('/');
    expect(sansLocale('/en')).toBe('/');
  });

  it('laisse un chemin sans préfixe inchangé', () => {
    expect(sansLocale('/dashboard')).toBe('/dashboard');
    expect(sansLocale('/')).toBe('/');
    expect(sansLocale('/admin/courses')).toBe('/admin/courses');
  });

  it('ne confond pas un chemin qui commence par une locale', () => {
    // ⚠️ Piège : « /frite » commence par « /fr » sans être une route française.
    // Un `startsWith('/fr')` nu le transformerait en « ite ». Le séparateur
    // (`/fr/`) ou l'égalité exacte (`/fr`) est ce qui l'évite.
    expect(sansLocale('/frite')).toBe('/frite');
    expect(sansLocale('/english')).toBe('/english');
    expect(sansLocale('/franglais')).toBe('/franglais');
  });

  it('rétablit la protection des pages privées localisées', () => {
    // Le défaut d'origine, figé ici : le chemin préfixé n'est pas reconnu…
    expect(isProtectedPath('/fr/dashboard')).toBe(false);
    expect(isProtectedPath('/en/admin')).toBe(false);

    // …et le retrait du préfixe la rétablit.
    expect(isProtectedPath(sansLocale('/fr/dashboard'))).toBe(true);
    expect(isProtectedPath(sansLocale('/en/admin'))).toBe(true);
    expect(isProtectedPath(sansLocale('/en/account'))).toBe(true);
    expect(isProtectedPath(sansLocale('/en/tutorial/git'))).toBe(true);
  });
});

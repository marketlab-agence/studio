/**
 * @jest-environment node
 *
 * Découpage des routes et amorçage de session (T4.9/T4.10).
 */
import { isGuestOnlyPath, isProtectedPath, PROTECTED_PREFIXES } from '@/lib/auth/routes';

/**
 * Ces listes servent à **deux** endroits : le middleware (qui redirige) et le
 * fournisseur d'authentification côté client (qui décide s'il doit attendre la
 * session avant de rendre la page). Un écart entre les deux produirait soit une
 * page protégée qui s'affiche vide, soit un spinner inutile sur une page
 * publique.
 */
describe('découpage des routes', () => {
  describe('routes protégées', () => {
    it('reconnaît les préfixes protégés', () => {
      for (const prefix of PROTECTED_PREFIXES) {
        expect(isProtectedPath(prefix)).toBe(true);
      }
    });

    it('reconnaît une sous-route protégée', () => {
      expect(isProtectedPath('/admin/courses')).toBe(true);
      expect(isProtectedPath('/admin/courses/git/chapters/ch1')).toBe(true);
      expect(isProtectedPath('/tutorial/git')).toBe(true);
    });

    it('ne confond pas un préfixe avec un chemin qui le commence', () => {
      // « /administratif » commence par « /admin » sans être une route admin.
      // Sans le contrôle sur le séparateur, cette page serait protégée à tort.
      expect(isProtectedPath('/administratif')).toBe(false);
      expect(isProtectedPath('/tutorials')).toBe(false);
      expect(isProtectedPath('/dashboards')).toBe(false);
    });

    it('laisse les pages publiques accessibles', () => {
      for (const path of ['/', '/courses', '/pricing', '/about', '/features', '/blog', '/health']) {
        expect(isProtectedPath(path)).toBe(false);
      }
    });

    it('laisse les pages d’authentification publiques', () => {
      // Sinon : redirection vers /login depuis /login, boucle infinie.
      expect(isProtectedPath('/login')).toBe(false);
      expect(isProtectedPath('/signup')).toBe(false);
      expect(isProtectedPath('/forgot-password')).toBe(false);
      expect(isProtectedPath('/reset-password')).toBe(false);
    });
  });

  describe('routes réservées aux visiteurs', () => {
    it('reconnaît les pages de connexion et d’inscription', () => {
      expect(isGuestOnlyPath('/login')).toBe(true);
      expect(isGuestOnlyPath('/signup')).toBe(true);
    });

    it('n’y inclut PAS les pages de réinitialisation', () => {
      // Un utilisateur connecté avec `must_reset_password` doit pouvoir y accéder :
      // s'il était redirigé, il ne pourrait jamais définir son mot de passe.
      expect(isGuestOnlyPath('/forgot-password')).toBe(false);
      expect(isGuestOnlyPath('/reset-password')).toBe(false);
    });

    it('ne protège pas et ne réserve pas les pages publiques', () => {
      for (const path of ['/', '/courses', '/pricing']) {
        expect(isProtectedPath(path)).toBe(false);
        expect(isGuestOnlyPath(path)).toBe(false);
      }
    });
  });
});

import type { AppUser } from '@/lib/users';
import type { OrgScope } from './types';

/** Filtres de recherche d'utilisateurs. */
export interface UserQuery {
  role?: AppUser['role'];
  status?: AppUser['status'];
  /** Recherche partielle sur le nom ou l'email. */
  search?: string;
  limit?: number;
}

/**
 * Accès aux comptes utilisateurs, restreint à l'organisation du scope.
 *
 * ⚠️ `list` ne retourne **jamais** un utilisateur d'une autre organisation.
 * Aucune méthode sans `scope` (ADR 0007).
 */
export interface UserProvider {
  list(scope: OrgScope, query?: UserQuery): Promise<AppUser[]>;
  getById(scope: OrgScope, userId: string): Promise<AppUser | null>;
  getByEmail(scope: OrgScope, email: string): Promise<AppUser | null>;
  create(scope: OrgScope, user: Omit<AppUser, 'id'>): Promise<AppUser>;
  update(scope: OrgScope, userId: string, changes: Partial<AppUser>): Promise<void>;
  setRole(scope: OrgScope, userId: string, role: AppUser['role']): Promise<void>;
  /**
   * Enregistre la langue d'interface préférée de l'utilisateur.
   *
   * ⚠️ **Méthode dédiée plutôt que `update` générique.** La préférence de langue est
   * une action de l'utilisateur sur **son propre** compte, pas une modification
   * administrative d'un tiers : le périmètre est donc vérifié contre `scope.userId`,
   * ce que `update` (qui prend un `userId` arbitraire) ne fait pas.
   */
  updatePreferredLanguage(scope: OrgScope, language: 'fr' | 'en' | 'es'): Promise<void>;
  delete(scope: OrgScope, userId: string): Promise<void>;
}

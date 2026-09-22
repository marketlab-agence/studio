import type { UserRole } from '@/lib/providers/types';

/**
 * Autorisation au sein d'une organisation (T4.14, REQ-ORG-06).
 *
 * ⚠️ **Ce module est la barrière réelle.** Le middleware Next ne peut pas
 * l'être : il s'exécute dans le runtime **Edge**, sans accès à la base, et ne
 * vérifie qu'un jeton. Un rôle doit donc être contrôlé **ici**, dans chaque
 * route et chaque server action — l'endroit où l'organisation est connue.
 *
 * Le rôle est lu depuis le jeton d'accès, dont la signature a été vérifiée : il
 * est donc digne de confiance pour un contrôle d'accès, à condition d'accepter
 * qu'il reflète le moment de l'émission (voir `currentUser` pour l'état réel).
 */

/** Rôles disposant de l'administration d'une organisation. */
const ORGANIZATION_ADMINS: readonly string[] = ['Super Admin', 'Propriétaire', 'Admin'];

/** Rôles pouvant gérer les membres (inviter, révoquer, changer un rôle). */
export function canManageMembers(role: string): boolean {
  return ORGANIZATION_ADMINS.includes(role);
}

/** Rôles pouvant modifier les réglages de l'organisation. */
export function canManageSettings(role: string): boolean {
  return ORGANIZATION_ADMINS.includes(role);
}

/**
 * Rôles pouvant gérer le contenu pédagogique.
 * Un Modérateur peut modifier le contenu sans administrer les membres : les deux
 * responsabilités ne vont pas nécessairement ensemble.
 */
export function canManageContent(role: string): boolean {
  return [...ORGANIZATION_ADMINS, 'Modérateur'].includes(role);
}

/**
 * Indique si `actor` peut attribuer `target` à quelqu'un d'autre.
 *
 * Deux limites :
 *
 * - on ne peut pas attribuer un rôle **supérieur au sien** — un Admin ne doit
 *   pas pouvoir créer un Propriétaire, sinon il pourrait s'élever par personne
 *   interposée ;
 * - seul un Propriétaire (ou Super Admin) peut attribuer « Propriétaire ».
 */
export function canAssignRole(actor: string, target: string): boolean {
  if (!canManageMembers(actor)) return false;

  // Le rôle plateforme ne s'attribue jamais par une organisation.
  if (target === 'Super Admin') return false;

  if (actor === 'Super Admin') return true;

  if (target === 'Propriétaire') {
    return actor === 'Propriétaire';
  }

  // Un Admin ne peut pas créer un autre Admin : seuls Propriétaire et
  // Super Admin le peuvent.
  if (target === 'Admin') {
    return actor === 'Propriétaire';
  }

  return true;
}

/** Vérifie un rôle reçu d'une source non fiable (jeton, corps de requête). */
export function asUserRole(value: string): UserRole {
  return value as UserRole;
}

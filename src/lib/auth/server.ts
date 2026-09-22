import { cookies } from 'next/headers';
import { tryVerifyAccessToken, type AccessTokenClaims } from '@/lib/auth/jwt';
import { ACCESS_COOKIE } from '@/lib/auth/cookies';
import { canManageContent, canManageMembers, canManageSettings } from '@/lib/auth/authorization';
import { scopeFromClaims } from '@/lib/auth/api';
import type { OrgScope } from '@/lib/providers/types';

/**
 * Autorisation côté serveur pour les **server actions** (T4.14, REQ-ORG-06).
 *
 * ⚠️ **Pourquoi ce module existe.** Une server action est un **point d'entrée
 * HTTP** : elle est joignable directement, sans passer par la page qui
 * l'affiche. Vérifier le rôle dans le composant React ne protège donc rien —
 * le navigateur peut appeler l'action sans jamais charger la page.
 *
 * Le `layout` admin vérifiait le rôle **côté client** : un utilisateur ordinaire
 * pouvait appeler `updateUserRoleAction` et s'octroyer les droits d'admin. La
 * vérification doit être **ici**, à l'endroit où l'action s'exécute.
 *
 * Le middleware Next ne peut pas s'en charger : il tourne dans le runtime
 * **Edge**, sans accès à la base ni aux cookies de session de la même manière.
 */

/** Levée quand aucune session valide n'accompagne l'appel. */
export class UnauthorizedError extends Error {
  constructor(message = 'Authentification requise.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** Levée quand la session existe mais que le rôle est insuffisant. */
export class ForbiddenError extends Error {
  constructor(message = 'Vous n’avez pas les droits pour effectuer cette action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Lit la session depuis les cookies de la requête courante.
 * Lève `UnauthorizedError` si le jeton est absent ou invalide.
 */
export async function requireSessionFromCookies(): Promise<AccessTokenClaims> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const claims = await tryVerifyAccessToken(token);

  if (!claims) {
    throw new UnauthorizedError();
  }

  return claims;
}

/** Session + scope d'organisation, prêts à l'emploi. */
export async function requireScope(): Promise<{
  claims: AccessTokenClaims;
  scope: OrgScope;
}> {
  const claims = await requireSessionFromCookies();
  return { claims, scope: scopeFromClaims(claims) };
}

/**
 * Exige un rôle habilité à gérer les **membres** (inviter, changer un rôle).
 *
 * Le rôle provient du jeton d'accès, dont la signature a été vérifiée : il est
 * donc fiable pour un contrôle d'accès. Il peut toutefois refléter le moment de
 * l'émission : une rétrogradation prend effet à l'expiration du jeton (15 min).
 * C'est un compromis assumé — vérifier l'état réel en base à chaque appel
 * ajouterait une requête, et le jeton est de courte durée.
 */
export async function requireMemberManager(): Promise<{
  claims: AccessTokenClaims;
  scope: OrgScope;
}> {
  const { claims, scope } = await requireScope();

  if (!canManageMembers(claims.role)) {
    throw new ForbiddenError('Vous n’avez pas les droits pour gérer les membres.');
  }

  return { claims, scope };
}

/** Exige un rôle habilité à modifier les **réglages** de l'organisation. */
export async function requireSettingsManager(): Promise<{
  claims: AccessTokenClaims;
  scope: OrgScope;
}> {
  const { claims, scope } = await requireScope();

  if (!canManageSettings(claims.role)) {
    throw new ForbiddenError('Vous n’avez pas les droits pour modifier les réglages.');
  }

  return { claims, scope };
}

/**
 * Exige un rôle habilité à gérer le **contenu pédagogique**.
 * Un Modérateur y a accès : modérer le contenu et administrer les membres sont
 * deux responsabilités distinctes.
 */
export async function requireContentManager(): Promise<{
  claims: AccessTokenClaims;
  scope: OrgScope;
}> {
  const { claims, scope } = await requireScope();

  if (!canManageContent(claims.role)) {
    throw new ForbiddenError('Vous n’avez pas les droits pour gérer le contenu.');
  }

  return { claims, scope };
}

/** Exige un rôle habilité à consulter les données d'administration. */
export async function requireAdminViewer(): Promise<{
  claims: AccessTokenClaims;
  scope: OrgScope;
}> {
  return requireContentManager();
}

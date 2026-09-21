/**
 * Types partagés de la couche providers.
 *
 * ⚠️ RÈGLE D'ISOLATION (ADR 0007)
 * Toute lecture et toute écriture reçoit un `OrgScope`. Un provider ne peut pas
 * être appelé sans : l'isolation entre organisations est **structurelle**, pas
 * déclarative — elle ne dépend pas de la vigilance de l'appelant.
 *
 * Conséquence recherchée : si quelqu'un ajoute plus tard une méthode de provider
 * sans `scope`, **elle ne doit pas compiler**. Voir les tests d'isolation.
 */

export type UserRole =
  | 'Super Admin'
  | 'Propriétaire'
  | 'Admin'
  | 'Modérateur'
  | 'Utilisateur';

/**
 * Contexte d'exécution. Fourni par la couche d'authentification (phase 4) ;
 * en phase 3, `getRequestScope()` le résout provisoirement (voir scope.ts).
 */
export interface OrgScope {
  /** Organisation à laquelle toutes les données lues/écrites sont rattachées. */
  organizationId: string;
  /** Utilisateur à l'origine de l'action (traçabilité, journal d'audit). */
  userId: string;
  role: UserRole;
}

/** Nature des jeux de données échangeables — utile au diagnostic. */
export type ProviderDomain = 'content' | 'users' | 'settings' | 'auth' | 'email' | 'storage' | 'payment' | 'ai' | 'notifications' | 'documents';

/** Erreur explicite lorsqu'un scope est manquant ou incohérent. */
export class ScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScopeError';
  }
}

/** Vérifie qu'un scope est exploitable avant toute requête. */
export function assertScope(scope: OrgScope | undefined | null): OrgScope {
  if (!scope?.organizationId) {
    throw new ScopeError(
      'Organisation manquante : toute opération de données exige un OrgScope. ' +
        'Utiliser getRequestScope() côté serveur.',
    );
  }
  if (!scope.userId) {
    throw new ScopeError('Utilisateur manquant dans le scope.');
  }
  return scope;
}

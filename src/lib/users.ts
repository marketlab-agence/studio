
export interface AppUser {
    id: string;
    name: string;
    email: string;
    planId: 'free' | 'premium' | string;
    status: 'Actif' | 'Inactif';
    role: 'Super Admin' | 'Admin' | 'Modérateur' | 'Utilisateur';
    joined: string; // e.g. '2023-01-15'
    phone?: string;
}

export const PREMIUM_PLAN_PRICE_EUR = 9.99;

/**
 * Libellés d'affichage des formules, indexés par identifiant de plan.
 * La source de vérité est `planId` (référence `plans.id`) : les pages ne doivent
 * jamais lire un libellé stocké sur l'utilisateur.
 */
export const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuit',
  premium: 'Premium',
};

/** Retourne le libellé d'une formule à partir de son identifiant. */
export function planLabel(planId?: string | null): string {
  if (!planId) return '—';
  return PLAN_LABELS[planId] ?? planId;
}

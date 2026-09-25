
export interface AppUser {
    id: string;
    name: string;
    email: string;
    planId: 'free' | 'premium' | string;
    status: 'Actif' | 'Inactif';
    role: 'Super Admin' | 'Admin' | 'Modérateur' | 'Utilisateur';
    joined: string; // e.g. '2023-01-15'
    phone?: string;
    /**
     * Langue d'interface préférée.
     *
     * ⚠️ **Distincte de `courses.language`.** Celle-ci décrit l'**utilisateur** (dans
     * quelle langue il veut lire l'interface) ; l'autre décrit le **contenu** (dans
     * quelle langue un créateur a écrit sa formation). Les confondre serait une
     * erreur de conception : un anglophone peut suivre une formation française.
     *
     * `null` = jamais choisie explicitement, la locale de l'URL ou le repli `fr` s'applique.
     */
    language?: 'fr' | 'en' | 'es' | null;
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

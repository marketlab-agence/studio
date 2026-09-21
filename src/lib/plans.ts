import type { SubscriptionPlan } from '@/types/plans.types';
import { getContentProvider, getRequestScope } from '@/lib/providers';

/**
 * Formules d'abonnement.
 *
 * Le catalogue des formules est **global** (une offre est partagée par toutes
 * les organisations, qui la référencent via `organizations.plan_id`). L'accès
 * passe malgré tout par le provider, afin que le stockage reste remplaçable
 * (ADR 0001) et pour permettre plus tard des offres propres à une organisation.
 */
export async function getPlans(): Promise<SubscriptionPlan[]> {
  const scope = await getRequestScope();
  return getContentProvider().listPlans(scope);
}

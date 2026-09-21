'use server';

import { getContentProvider, getRequestScope } from '@/lib/providers';
import type { SubscriptionPlan } from '@/types/plans.types';

/**
 * Formules d'abonnement.
 *
 * Le catalogue est **global** : ces écritures affectent toutes les
 * organisations, contrairement au contenu pédagogique qui est cloisonné. Le
 * contrôle d'autorisation correspondant (administration plateforme) relève de
 * la phase 4 (REQ-SEC).
 */

export async function getPlansAction(): Promise<SubscriptionPlan[]> {
  try {
    const scope = await getRequestScope();
    return await getContentProvider().listPlans(scope);
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return [];
  }
}

export async function createOrUpdatePlanAction(planData: Omit<SubscriptionPlan, 'id'>, id?: string): Promise<SubscriptionPlan> {
  const scope = await getRequestScope();
  const plan: SubscriptionPlan = {
    ...planData,
    id: id ?? planData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  };

  return await getContentProvider().upsertPlan(scope, plan);
}

export async function deletePlanAction(planId: string): Promise<void> {
    if (planId === 'free' || planId === 'premium') {
        throw new Error('Les plans de base "free" et "premium" ne peuvent pas être supprimés.');
    }
    const scope = await getRequestScope();
    await getContentProvider().deletePlan(scope, planId);
}

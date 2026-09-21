'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getPlans } from '@/lib/plans';
import type { SubscriptionPlan } from '@/types/plans.types';

const PLANS_COLLECTION = 'plans';

export async function getPlansAction(): Promise<SubscriptionPlan[]> {
  try {
    const { db } = await getFirebaseAdmin();
    return await getPlans(db);
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return [];
  }
}

export async function createOrUpdatePlanAction(planData: Omit<SubscriptionPlan, 'id'>, id?: string): Promise<SubscriptionPlan> {
  const { db } = await getFirebaseAdmin();
  const docRef = id ? db.collection(PLANS_COLLECTION).doc(id) : db.collection(PLANS_COLLECTION).doc();
  const finalData = { id: docRef.id, ...planData };

  await docRef.set(finalData, { merge: true });

  return finalData;
}

export async function deletePlanAction(planId: string): Promise<void> {
    if (planId === 'free' || planId === 'premium') {
        throw new Error('Les plans de base "free" et "premium" ne peuvent pas être supprimés.');
    }
    const { db } = await getFirebaseAdmin();
    await db.collection(PLANS_COLLECTION).doc(planId).delete();
}
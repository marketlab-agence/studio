
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { SubscriptionPlan } from '@/types/plans.types';
import { revalidatePath } from 'next/cache';

const PLANS_COLLECTION = 'plans';

export async function getPlansAction(): Promise<SubscriptionPlan[]> {
  try {
    const { db } = await getFirebaseAdmin();
    const snapshot = await db.collection(PLANS_COLLECTION).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
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

  revalidatePath('/admin/subscriptions');
  revalidatePath('/admin/subscriptions/create');
  
  return finalData;
}

export async function deletePlanAction(planId: string): Promise<void> {
    if (planId === 'free' || planId === 'premium') {
        throw new Error('Les plans de base "free" et "premium" ne peuvent pas être supprimés.');
    }
    const { db } = await getFirebaseAdmin();
    await db.collection(PLANS_COLLECTION).doc(planId).delete();
    revalidatePath('/admin/subscriptions');
}

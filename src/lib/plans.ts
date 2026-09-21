import type { SubscriptionPlan } from '@/types/plans.types';
import type { Firestore } from 'firebase-admin/firestore';
import { withLocalFallback } from './local-data';

const PLANS_COLLECTION = 'plans';

/**
 * Retrieves all subscription plans from the Firestore 'plans' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<SubscriptionPlan[]>} A promise that resolves to an array of plans.
 */
export async function getPlans(db: Firestore): Promise<SubscriptionPlan[]> {
  return withLocalFallback(
    'plans',
    async () => {
      const snapshot = await db.collection(PLANS_COLLECTION).get();
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
    },
    (local) => local as SubscriptionPlan[],
  );
}

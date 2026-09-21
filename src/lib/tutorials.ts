
import { Tutorial } from '@/types/tutorial.types';
import type { Firestore } from 'firebase-admin/firestore';
import { withLocalFallback } from './local-data';

const TUTORIALS_COLLECTION = 'tutorials';

/**
 * Retrieves all tutorials from the Firestore 'tutorials' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Tutorial[]>} A promise that resolves to an array of tutorials.
 */
export async function getTutorials(db: Firestore): Promise<Tutorial[]> {
  return withLocalFallback(
    'tutorials',
    async () => {
      const snapshot = await db.collection(TUTORIALS_COLLECTION).get();
      if (snapshot.empty) {
        console.log('No tutorials found.');
        return [];
      }
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tutorial));
    },
    (local) => local as Tutorial[],
  );
}

/**
 * Saves an array of tutorials to the Firestore 'tutorials' collection.
 * This function uses a batch write to set each tutorial, overwriting if it exists.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Tutorial[]} tutorials - An array of tutorial objects to save.
 * @returns {Promise<void>}
 */
export async function saveTutorials(db: Firestore, tutorials: Tutorial[]): Promise<void> {
  const batch = db.batch();
  
  tutorials.forEach(tutorial => {
    const docRef = db.collection(TUTORIALS_COLLECTION).doc(tutorial.id);
    batch.set(docRef, tutorial);
  });

  try {
    await batch.commit();
    console.log("Tutorials saved successfully to Firestore.");
  } catch (error) {
    console.error("Error saving tutorials to Firestore: ", error);
    throw new Error("Could not save tutorials to Firestore.");
  }
}

/**
 * Retrieves a single tutorial by its ID from the Firestore 'tutorials' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the tutorial to retrieve.
 * @returns {Promise<Tutorial | null>} A promise that resolves to the tutorial or null if not found.
 */
export async function getTutorialById(db: Firestore, id: string): Promise<Tutorial | null> {
    return withLocalFallback(
      'tutorials',
      async () => {
        const docRef = db.collection(TUTORIALS_COLLECTION).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
          console.log(`No tutorial found with id: ${id}`);
          return null;
        }

        return { id: doc.id, ...doc.data() } as Tutorial;
      },
      (local) => (local as Tutorial[]).find(tutorial => tutorial.id === id) ?? null,
    );
}

/**
 * Deletes a tutorial from the Firestore 'tutorials' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the tutorial to delete.
 * @returns {Promise<void>}
 */
export async function deleteTutorial(db: Firestore, id: string): Promise<void> {
    try {
        const docRef = db.collection(TUTORIALS_COLLECTION).doc(id);
        await docRef.delete();
    } catch (error) {
        console.error(`Error deleting tutorial ${id}: `, error);
        throw new Error("Could not delete tutorial from Firestore.");
    }
}

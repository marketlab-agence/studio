
import { Tutorial } from '@/types/tutorial.types';
import type { Firestore } from 'firebase-admin/firestore'; // Import only the type

const TUTORIALS_COLLECTION = 'tutorials';

/**
 * Retrieves all tutorials from the Firestore 'tutorials' collection.
 * This function can be called from server components or actions.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Tutorial[]>} A promise that resolves to an array of tutorials.
 */
export async function getTutorials(db: Firestore): Promise<Tutorial[]> {
  try {
    const snapshot = await db.collection(TUTORIALS_COLLECTION).get();
    if (snapshot.empty) {
      console.log('No tutorials found.');
      return [];
    }
    const tutorials: Tutorial[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Tutorial));
    return tutorials;
  } catch (error) {
    console.error("Error getting tutorials: ", error);
    throw new Error("Could not fetch tutorials from Firestore.");
  }
}

/**
 * Saves an array of tutorials to the Firestore 'tutorials' collection.
 * This function will overwrite existing documents with the same ID.
 * This function should only be called from server actions.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Tutorial[]} tutorials - An array of tutorial objects to save.
 * @returns {Promise<void>}
 */
export async function saveTutorials(db: Firestore, tutorials: Tutorial[]): Promise<void> {
  const batch = db.batch();

  tutorials.forEach(tutorial => {
    const docRef = tutorial.id
      ? db.collection(TUTORIALS_COLLECTION).doc(tutorial.id)
      : db.collection(TUTORIALS_COLLECTION).doc();

    const tutorialData = { ...tutorial };
    if (!tutorial.id) {
        tutorialData.id = docRef.id;
    }
      
    batch.set(docRef, tutorialData);
  });

  try {
    await batch.commit();
    console.log("Tutorials saved successfully to Firestore.");
  } catch (error) {
    console.error("Error saving tutorials to Firestore: ", error);
    throw new Error("Could not save tutorials to Firestore.");
  }
}

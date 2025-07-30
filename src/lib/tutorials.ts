
import { Tutorial } from '@/types/tutorial.types';
import type { Firestore } from 'firebase-admin/firestore'; // Import only the type

const TUTORIALS_COLLECTION = 'tutorials';

/**
 * Retrieves all tutorials from the Firestore 'tutorials' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Tutorial[]>} A promise that resolves to an array of tutorials.
 */
export async function getTutorials(db: Firestore): Promise<Tutorial[]> {
  try {
    const snapshot = await db.collection(TUTORIALS_COLLECTION).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tutorial));
  } catch (error) {
    console.error("Error getting tutorials: ", error);
    throw new Error("Could not fetch tutorials from Firestore.");
  }
}

/**
 * Retrieves a single tutorial by its ID.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the tutorial to retrieve.
 * @returns {Promise<Tutorial | null>} The tutorial object or null if not found.
 */
export async function getTutorialById(db: Firestore, id: string): Promise<Tutorial | null> {
    try {
      const docRef = db.collection(TUTORIALS_COLLECTION).doc(id);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return null;
      }
  
      return { id: doc.id, ...doc.data() } as Tutorial;
    } catch (error) {
      console.error(`Error getting tutorial ${id}: `, error);
      throw new Error("Could not fetch tutorial from Firestore.");
    }
}

/**
 * Creates a new tutorial in Firestore.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Omit<Tutorial, 'id'>} tutorialData - The tutorial data to create.
 * @returns {Promise<Tutorial>} The newly created tutorial with its ID.
 */
export async function createTutorial(db: Firestore, tutorialData: Omit<Tutorial, 'id'>): Promise<Tutorial> {
    try {
        const docRef = await db.collection(TUTORIALS_COLLECTION).add(tutorialData);
        return { id: docRef.id, ...tutorialData } as Tutorial;
    } catch (error) {
        console.error("Error creating tutorial: ", error);
        throw new Error("Could not create tutorial in Firestore.");
    }
}

/**
 * Updates an existing tutorial in Firestore.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the tutorial to update.
 * @param {Partial<Tutorial>} tutorialData - The data to update.
 * @returns {Promise<void>}
 */
export async function updateTutorial(db: Firestore, id: string, tutorialData: Partial<Tutorial>): Promise<void> {
    try {
        const docRef = db.collection(TUTORIALS_COLLECTION).doc(id);
        await docRef.update(tutorialData);
    } catch (error) {
        console.error(`Error updating tutorial ${id}: `, error);
        throw new Error("Could not update tutorial in Firestore.");
    }
}

/**
 * Deletes a tutorial from Firestore.
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

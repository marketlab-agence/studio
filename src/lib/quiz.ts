
import { Quiz } from '@/types/tutorial.types';
import type { Firestore } from 'firebase-admin/firestore'; // Import only the type

const QUIZZES_COLLECTION = 'quizzes';

/**
 * Retrieves all quizzes from the Firestore 'quizzes' collection.
 * This function can be called from server components or actions.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Record<string, Quiz>>} A promise that resolves to an object where keys are quiz IDs.
 */
export async function getQuizzes(db: Firestore): Promise<Record<string, Quiz>> {
  try {
    const snapshot = await db.collection(QUIZZES_COLLECTION).get();
    if (snapshot.empty) {
      return {};
    }
    const quizzes: Record<string, Quiz> = {};
    snapshot.docs.forEach(doc => {
        // The document ID is the key for the quiz object
        quizzes[doc.id] = { id: doc.id, ...doc.data() } as Quiz;
    });
    return quizzes;
  } catch (error: any) {
    console.error("Error getting quizzes from Firestore: ", error.message || error);
    throw new Error("Could not fetch quizzes from Firestore.");
  }
}

/**
 * Retrieves a single quiz by its ID from the Firestore 'quizzes' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the quiz to retrieve.
 * @returns {Promise<Quiz | null>} A promise that resolves to the quiz or null if not found.
 */
export async function getQuizById(db: Firestore, id: string): Promise<Quiz | null> {
    try {
      const docRef = db.collection(QUIZZES_COLLECTION).doc(id);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as Quiz;
    } catch (error: any) {
      console.error(`Error getting quiz by id ${id} from Firestore: `, error.message || error);
      throw new Error("Could not fetch quiz from Firestore.");
    }
}


/**
 * Saves or updates a dictionary of quizzes in the Firestore 'quizzes' collection.
 * Each key in the object is treated as a document ID.
 * This is useful for saving all quizzes at once.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Record<string, Quiz>} quizzes - An object where keys are quiz IDs and values are quiz data.
 * @returns {Promise<void>}
 */
export async function saveQuizzes(db: Firestore, quizzes: Record<string, Quiz>): Promise<void> {
    const batch = db.batch();

    for (const quizId in quizzes) {
        if (Object.prototype.hasOwnProperty.call(quizzes, quizId)) {
            const quizData = quizzes[quizId];
            if (!quizId) {
                 console.error("Quiz object is missing an ID. Skipping save.", quizData);
                 continue;
            }
            const docRef = db.collection(QUIZZES_COLLECTION).doc(quizId);
            // Ensure the id within the object matches the document id
            batch.set(docRef, { ...quizData, id: quizId });
        }
    }

    try {
        await batch.commit();
    } catch (error: any) {
        console.error("Error saving quizzes to Firestore: ", error.message || error);
        throw new Error("Could not save quizzes to Firestore.");
    }
}

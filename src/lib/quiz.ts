
import { Quiz } from '@/types/tutorial.types';
import type { Firestore } from 'firebase-admin/firestore';

const QUIZZES_COLLECTION = 'quizzes';
const DEFAULT_QUIZZES_DOC_ID = 'default';

/**
 * Retrieves all quizzes from the Firestore 'quizzes' collection.
 * It fetches a single document named 'default' which should contain an object
 * where keys are quiz IDs.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Record<string, Quiz>>} A promise that resolves to an object where keys are quiz IDs.
 */
export async function getQuizzes(db: Firestore): Promise<Record<string, Quiz>> {
  try {
    const docRef = db.collection(QUIZZES_COLLECTION).doc(DEFAULT_QUIZZES_DOC_ID);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log("Quizzes document not found, returning empty object.");
      return {};
    }
    
    return doc.data() as Record<string, Quiz> || {};
  } catch (error: any) {
    console.error("Error getting quizzes from Firestore: ", error.message || error);
    throw new Error("Could not fetch quizzes from Firestore.");
  }
}

/**
 * Retrieves a single quiz by its ID from the quizzes document.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the quiz to retrieve.
 * @returns {Promise<Quiz | null>} A promise that resolves to the quiz or null if not found.
 */
export async function getQuizById(db: Firestore, id: string): Promise<Quiz | null> {
    try {
        const quizzes = await getQuizzes(db);
        return quizzes[id] || null;
    } catch (error: any) {
      console.error(`Error getting quiz by id ${id} from Firestore: `, error.message || error);
      throw new Error("Could not fetch quiz from Firestore.");
    }
}


/**
 * Saves a dictionary of quizzes to a single document in the Firestore 'quizzes' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Record<string, Quiz>} quizzes - An object where keys are quiz IDs and values are quiz data.
 * @returns {Promise<void>}
 */
export async function saveQuizzes(db: Firestore, quizzes: Record<string, Quiz>): Promise<void> {
    try {
        const docRef = db.collection(QUIZZES_COLLECTION).doc(DEFAULT_QUIZZES_DOC_ID);
        // Using set with merge: true to avoid overwriting the whole document if not necessary,
        // although in this case we are overwriting the whole object.
        await docRef.set(quizzes, { merge: true });
    } catch (error: any) {
        console.error("Error saving quizzes to Firestore: ", error.message || error);
        throw new Error("Could not save quizzes to Firestore.");
    }
}

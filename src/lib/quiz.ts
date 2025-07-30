
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
    console.log("Attempting to get quizzes from Firestore...");
    const snapshot = await db.collection(QUIZZES_COLLECTION).get();
    if (snapshot.empty) {
      console.log('No quizzes found in Firestore.');
      return {};
    }
    const quizzes: Record<string, Quiz> = {};
    snapshot.docs.forEach(doc => {
      quizzes[doc.id] = { id: doc.id, ...doc.data() } as Quiz;
    });
    console.log(`Successfully fetched ${Object.keys(quizzes).length} quizzes from Firestore.`);
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
      console.log(`Attempting to get quiz by id ${id} from Firestore.`);
      const docRef = db.collection(QUIZZES_COLLECTION).doc(id);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        console.log(`No quiz found with id: ${id} in Firestore.`);
        return null;
      }
      console.log(`Successfully fetched quiz by id ${id} from Firestore.`);
      return { id: doc.id, ...doc.data() } as Quiz;
    } catch (error: any) {
      console.error(`Error getting quiz by id ${id} from Firestore: `, error.message || error);
      throw new Error("Could not fetch quiz from Firestore.");
    }
}

/**
 * Creates or updates a quiz in the Firestore 'quizzes' collection.
 * If the quiz object has an ID, it will update the existing document.
 * If not, it will create a new one.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Quiz} quiz - The quiz object to save.
 * @returns {Promise<Quiz>} The saved quiz object with its ID.
 */
export async function createOrUpdateQuiz(db: Firestore, quiz: Quiz): Promise<Quiz> {
  const docRef = quiz.id
    ? db.collection(QUIZZES_COLLECTION).doc(quiz.id)
    : db.collection(QUIZZES_COLLECTION).doc();

  const quizData = { ...quiz, id: docRef.id };

  try {
    console.log(`Attempting to save quiz ${docRef.id} to Firestore.`);
    await docRef.set(quizData, { merge: true }); // merge: true to avoid overwriting fields not in quizData
    console.log(`Quiz ${docRef.id} saved successfully.`);
    return quizData;
  } catch (error: any) {
    console.error(`Error saving quiz ${docRef.id} to Firestore: `, error.message || error);
    throw new Error("Could not save quiz to Firestore.");
  }
}

/**
 * Deletes a quiz from the Firestore 'quizzes' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the quiz to delete.
 * @returns {Promise<void>}
 */
export async function deleteQuiz(db: Firestore, id: string): Promise<void> {
    try {
        console.log(`Attempting to delete quiz ${id} from Firestore.`);
        const docRef = db.collection(QUIZZES_COLLECTION).doc(id);
        await docRef.delete();
        console.log(`Quiz ${id} deleted successfully.`);
    } catch (error: any) {
        console.error(`Error deleting quiz ${id} from Firestore: `, error.message || error);
        throw new Error("Could not delete quiz from Firestore.");
    }
}

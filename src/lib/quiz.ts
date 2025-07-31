
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
      console.log('No quizzes found.');
      return {};
    }
    const quizzes: Record<string, Quiz> = {};
    snapshot.docs.forEach(doc => {
      quizzes[doc.id] = { id: doc.id, ...doc.data() } as Quiz;
    });
    return quizzes;
  } catch (error) {
    console.error("Error getting quizzes: ", error);
    throw new Error("Could not fetch quizzes from Firestore.");
  }
}

/**
 * Saves a map of quizzes to the Firestore 'quizzes' collection.
 * This will overwrite the entire collection with the new data.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Record<string, Quiz>} quizzes - The map of quizzes to save.
 * @returns {Promise<void>}
 */
export async function saveQuizzes(db: Firestore, quizzes: Record<string, Quiz>): Promise<void> {
    const batch = db.batch();
    
    // Optional: To delete all existing quizzes first if you want a clean slate
    // const snapshot = await db.collection(QUIZZES_COLLECTION).get();
    // snapshot.docs.forEach(doc => batch.delete(doc.ref));

    Object.keys(quizzes).forEach(quizId => {
        const docRef = db.collection(QUIZZES_COLLECTION).doc(quizId);
        batch.set(docRef, quizzes[quizId]);
    });

    try {
        await batch.commit();
        console.log("Quizzes saved successfully to Firestore.");
    } catch (error) {
        console.error("Error saving quizzes to Firestore: ", error);
        throw new Error("Could not save quizzes to Firestore.");
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
        console.log(`No quiz found with id: ${id}`);
        return null;
      }
  
      return { id: doc.id, ...doc.data() } as Quiz;
    } catch (error) {
      console.error(`Error getting quiz by id ${id}: `, error);
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
    await docRef.set(quizData, { merge: true }); // merge: true to avoid overwriting fields not in quizData
    return quizData;
  } catch (error) {
    console.error(`Error saving quiz ${docRef.id}: `, error);
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
        const docRef = db.collection(QUIZZES_COLLECTION).doc(id);
        await docRef.delete();
    } catch (error) {
        console.error(`Error deleting quiz ${id}: `, error);
        throw new Error("Could not delete quiz from Firestore.");
    }
}

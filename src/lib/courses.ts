
import { CourseInfo } from '@/types/course.types';
import type { Firestore } from 'firebase-admin/firestore'; // Import only the type

const COURSES_COLLECTION = 'courses';

/**
 * Retrieves all courses from the Firestore 'courses' collection.
 * This function should be called from server components or actions.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<CourseInfo[]>} A promise that resolves to an array of courses.
 */
export async function getCourses(db: Firestore): Promise<CourseInfo[]> {
  try {
    const snapshot = await db.collection(COURSES_COLLECTION).get();
    if (snapshot.empty) {
      return [];
    }
    const courses: CourseInfo[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CourseInfo));
    return courses;
  } catch (error: any) {
    console.error("Error getting courses from Firestore: ", error.message || error);
    throw new Error("Could not fetch courses from Firestore.");
  }
}

/**
 * Retrieves a single course by its ID from the Firestore 'courses' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the course to retrieve.
 * @returns {Promise<CourseInfo | null>} A promise that resolves to the course or null if not found.
 */
export async function getCourseById(db: Firestore, id: string): Promise<CourseInfo | null> {
    try {
      const docRef = db.collection(COURSES_COLLECTION).doc(id);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as CourseInfo;
    } catch (error: any) {
      console.error(`Error getting course by id ${id} from Firestore: `, error.message || error);
      throw new Error("Could not fetch course from Firestore.");
    }
}


/**
 * Saves an array of courses to the Firestore 'courses' collection.
 * This function will overwrite existing documents with the same ID.
 * This function should only be called from server actions.
 * @param {Firestore} db - The Firestore database instance.
 * @param {CourseInfo[]} courses - An array of course objects to save.
 * @returns {Promise<void>}
 */
export async function saveCourses(db: Firestore, courses: CourseInfo[]): Promise<void> {
  const batch = db.batch();

  courses.forEach(course => {
    // Ensure the course has an ID. If not, something is wrong.
    if (!course.id) {
        console.error("Course object is missing an ID. Skipping save.", course);
        return;
    }
    const docRef = db.collection(COURSES_COLLECTION).doc(course.id);
    batch.set(docRef, course);
  });

  try {
    await batch.commit();
  } catch (error: any) {
    console.error("Error saving courses to Firestore: ", error.message || error);
    throw new Error("Could not save courses to Firestore.");
  }
}


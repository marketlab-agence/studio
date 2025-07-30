
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
    console.log("Attempting to get courses from Firestore...");
    const snapshot = await db.collection(COURSES_COLLECTION).get();
    if (snapshot.empty) {
      console.log('No courses found in Firestore.');
      return [];
    }
    const courses: CourseInfo[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CourseInfo));
    console.log(`Successfully fetched ${courses.length} courses from Firestore.`);
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
      console.log(`Attempting to get course by id ${id} from Firestore.`);
      const docRef = db.collection(COURSES_COLLECTION).doc(id);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        console.log(`No course found with id: ${id} in Firestore.`);
        return null;
      }
      console.log(`Successfully fetched course by id ${id} from Firestore.`);
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
    const docRef = course.id 
      ? db.collection(COURSES_COLLECTION).doc(course.id)
      : db.collection(COURSES_COLLECTION).doc();

    const courseData = { ...course };
    if (!course.id) {
        courseData.id = docRef.id;
    }
      
    batch.set(docRef, courseData);
  });

  try {
    console.log("Attempting to save courses to Firestore...");
    await batch.commit();
    console.log("Courses saved successfully to Firestore.");
  } catch (error: any) {
    console.error("Error saving courses to Firestore: ", error.message || error);
    throw new Error("Could not save courses to Firestore.");
  }
}

/**
 * Creates a new course in the Firestore 'courses' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {Omit<CourseInfo, 'id'>} courseData - The course data to create (without the id).
 * @returns {Promise<CourseInfo>} The newly created course with its ID.
 */
export async function createCourse(db: Firestore, courseData: Omit<CourseInfo, 'id'>): Promise<CourseInfo> {
    try {
        console.log("Attempting to create course in Firestore...");
        const docRef = await db.collection(COURSES_COLLECTION).add(courseData);
        console.log(`Course created with ID: ${docRef.id}`);
        return { id: docRef.id, ...courseData } as CourseInfo;
    } catch (error: any) {
        console.error("Error creating course in Firestore: ", error.message || error);
        throw new Error("Could not create course in Firestore.");
    }
}

/**
 * Updates a course in the Firestore 'courses' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the course to update.
 * @param {Partial<CourseInfo>} courseData - The partial course data to update.
 * @returns {Promise<void>}
 */
export async function updateCourse(db: Firestore, id: string, courseData: Partial<CourseInfo>): Promise<void> {
    try {
        console.log(`Attempting to update course ${id} in Firestore.`);
        const docRef = db.collection(COURSES_COLLECTION).doc(id);
        await docRef.update(courseData);
        console.log(`Course ${id} updated successfully.`);
    } catch (error: any) {
        console.error(`Error updating course ${id} in Firestore: `, error.message || error);
        throw new Error("Could not update course in Firestore.");
    }
}

/**
 * Deletes a course from the Firestore 'courses' collection.
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} id - The ID of the course to delete.
 * @returns {Promise<void>}
 */
export async function deleteCourse(db: Firestore, id: string): Promise<void> {
    try {
        console.log(`Attempting to delete course ${id} from Firestore.`);
        const docRef = db.collection(COURSES_COLLECTION).doc(id);
        await docRef.delete();
        console.log(`Course ${id} deleted successfully.`);
    } catch (error: any) {
        console.error(`Error deleting course ${id} from Firestore: `, error.message || error);
        throw new Error("Could not delete course from Firestore.");
    }
}

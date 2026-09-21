import type { CourseInfo } from '@/types/course.types';
import { getContentProvider, getRequestScope } from '@/lib/providers';

/**
 * Formations de l'organisation courante.
 *
 * Ce module ne connaît plus Firestore : il passe par `ContentProvider`, dont
 * l'implémentation est choisie par `DATA_PROVIDER` (ADR 0001). Le `scope`
 * d'organisation est résolu par `getRequestScope()` — aucun appelant n'a donc
 * à le manipuler, et l'isolation entre organisations reste garantie.
 */

/** Récupère toutes les formations de l'organisation courante. */
export async function getCourses(): Promise<CourseInfo[]> {
  const scope = await getRequestScope();
  return getContentProvider().listCourses(scope);
}

/** Récupère une formation par son identifiant, ou `null` si absente. */
export async function getCourseById(id: string): Promise<CourseInfo | null> {
  const scope = await getRequestScope();
  return getContentProvider().getCourse(scope, id);
}

/** Enregistre une liste de formations (écrase les documents de même identifiant). */
export async function saveCourses(courses: CourseInfo[]): Promise<void> {
  const scope = await getRequestScope();
  await getContentProvider().saveCourses(scope, courses);
}

/** Crée une formation et retourne l'objet créé, identifiant compris. */
export async function createCourse(courseData: Omit<CourseInfo, 'id'>): Promise<CourseInfo> {
  const scope = await getRequestScope();
  return getContentProvider().createCourse(scope, courseData);
}

/** Met à jour les champs fournis d'une formation ; les autres sont conservés. */
export async function updateCourse(id: string, courseData: Partial<CourseInfo>): Promise<void> {
  const scope = await getRequestScope();
  await getContentProvider().updateCourse(scope, id, courseData);
}

/**
 * Supprime une formation.
 * Chapitres, leçons et quiz suivent en cascade (contraintes `ON DELETE CASCADE`).
 */
export async function deleteCourse(id: string): Promise<void> {
  const scope = await getRequestScope();
  await getContentProvider().deleteCourse(scope, id);
}

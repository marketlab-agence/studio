import { request, type ApiResult } from '@/lib/api-client';

/**
 * Progression côté navigateur (REQ-PROG-01, REQ-PROG-02).
 *
 * Le contexte React ne porte que l'**état** ; ces fonctions ne font que parler
 * au serveur. `Set` ne traverse pas JSON : les leçons terminées sont converties
 * en tableau à l'aller et en `Set` au retour, à un seul endroit.
 */

/** Progression d'une formation, telle que le serveur la renvoie. */
export interface CourseProgressPayload {
  completedLessons: string[];
  quizScores: Record<string, number>;
  quizAttempts: Record<string, number>;
  quizAnswers: Record<string, Record<string, string[]>>;
  currentChapterId: string | null;
  currentLessonId: string | null;
  currentView: 'lesson' | 'quiz';
}

/** Progression de l'apprenant, indexée par identifiant de formation. */
export type GlobalProgressPayload = Record<string, CourseProgressPayload>;

/** Progression d'une formation, en mémoire : les leçons sont un `Set`. */
export interface CourseProgressState extends Omit<CourseProgressPayload, 'completedLessons'> {
  completedLessons: Set<string>;
}

export type GlobalProgressState = Record<string, CourseProgressState>;

/** Charge toute la progression de l'apprenant connecté. */
export async function fetchProgress(): Promise<ApiResult<{ progress: GlobalProgressPayload }>> {
  return request('/api/v1/progress');
}

/** Enregistre la progression d'une formation. */
export function saveProgress(
  courseId: string,
  progress: CourseProgressState,
): Promise<ApiResult<{ saved: boolean }>> {
  return request('/api/v1/progress', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      ...progress,
      // `Set` ne survit pas à `JSON.stringify` : il deviendrait `{}`. On le
      // convertit explicitement, à un seul endroit.
      completedLessons: [...progress.completedLessons],
    }),
  });
}

/** Convertit la charge utile du serveur en état mémoire. */
export function toState(payload: GlobalProgressPayload): GlobalProgressState {
  return Object.fromEntries(
    Object.entries(payload).map(([courseId, course]) => [
      courseId,
      { ...course, completedLessons: new Set(course.completedLessons) },
    ]),
  );
}

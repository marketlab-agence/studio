import type { Quiz } from '@/types/tutorial.types';
import { getContentProvider, getRequestScope } from '@/lib/providers';

/**
 * Quiz de l'organisation courante, indexés par identifiant de chapitre.
 * Ce module ne connaît plus Firestore : il passe par `ContentProvider` (ADR 0001).
 */

/** Récupère tous les quiz, indexés par identifiant de chapitre. */
export async function getQuizzes(): Promise<Record<string, Quiz>> {
  const scope = await getRequestScope();
  return getContentProvider().listQuizMap(scope);
}

/** Enregistre une carte de quiz (clé = identifiant de chapitre). */
export async function saveQuizzes(quizzes: Record<string, Quiz>): Promise<void> {
  const scope = await getRequestScope();
  await getContentProvider().saveQuizMap(scope, quizzes);
}

/** Récupère un quiz par l'identifiant de son chapitre, ou `null` si absent. */
export async function getQuizById(id: string): Promise<Quiz | null> {
  const scope = await getRequestScope();
  return getContentProvider().getQuiz(scope, id);
}

/**
 * Crée ou met à jour un quiz.
 * Convention de l'application : `quiz.id` est l'identifiant du chapitre porteur.
 */
export async function createOrUpdateQuiz(quiz: Quiz): Promise<Quiz> {
  const scope = await getRequestScope();
  await getContentProvider().saveQuizMap(scope, { [quiz.id]: quiz });
  return quiz;
}

/** Supprime un quiz ; ses questions et réponses suivent en cascade. */
export async function deleteQuiz(id: string): Promise<void> {
  const scope = await getRequestScope();
  await getContentProvider().deleteQuiz(scope, id);
}

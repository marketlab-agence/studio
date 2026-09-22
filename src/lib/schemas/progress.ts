import { z } from 'zod';

/**
 * Schémas de la progression (REQ-PROG-01).
 *
 * Le client envoie la progression complète d'**une** formation à la fois : c'est
 * la granularité naturelle du parcours (on suit une formation, pas un catalogue).
 * Le serveur valide les bornes avant d'écrire — une valeur aberrante venue du
 * navigateur ne doit pas atteindre la base.
 */

/** Identifiant de chapitre ou de leçon : une chaîne non vide, bornée. */
const identifier = z.string().trim().min(1).max(200);

/** Score de quiz : un pourcentage. */
const score = z.number().min(0).max(100);

export const progressSaveSchema = z.object({
  courseId: identifier,
  completedLessons: z.array(identifier).max(2000, 'Trop de leçons pour une seule formation.'),
  quizScores: z.record(identifier, score).default({}),
  quizAttempts: z
    .record(identifier, z.number().int().min(0).max(10_000))
    .default({}),
  quizAnswers: z
    .record(identifier, z.record(identifier, z.array(identifier).max(50)))
    .default({}),
  currentChapterId: identifier.nullable().default(null),
  currentLessonId: identifier.nullable().default(null),
  currentView: z.enum(['lesson', 'quiz']).default('lesson'),
});

export type ProgressSaveInput = z.infer<typeof progressSaveSchema>;

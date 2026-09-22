import { query, withTransaction } from '@/lib/db/pool';
import {
  emptyCourseProgress,
  type CourseProgress,
  type GlobalProgress,
  type ProgressProvider,
} from '../progress';
import { assertScope, type OrgScope } from '../types';

type CourseProgressRow = {
  course_id: string;
  quiz_scores: Record<string, number> | null;
  quiz_attempts: Record<string, number> | null;
  quiz_answers: Record<string, Record<string, string[]>> | null;
  current_chapter_id: string | null;
  current_lesson_id: string | null;
  current_view: string;
};

/**
 * Progression en PostgreSQL (REQ-PROG-01, REQ-PROG-02).
 *
 * RÈGLE D'ISOLATION : la progression appartient à un **utilisateur** d'une
 * **organisation**. Les lectures filtrent donc par organisation via la
 * formation propriétaire — un apprenant ne doit pas voir la progression d'un
 * autre, ni celle d'une autre organisation.
 *
 * ⚠️ Aucune méthode ne reçoit d'identifiant d'utilisateur en paramètre : il vient
 * toujours du `scope`, donc du jeton vérifié. Accepter un identifiant fourni par
 * l'appelant permettrait d'écrire la progression d'autrui.
 */
export class PostgresProgressProvider implements ProgressProvider {
  async getAll(scope: OrgScope): Promise<GlobalProgress> {
    const { organizationId, userId } = assertScope(scope);

    // Positions et données de quiz, filtrées par organisation via la formation.
    const { rows: courseRows } = await query<CourseProgressRow>(
      `SELECT p.course_id, p.quiz_scores, p.quiz_attempts, p.quiz_answers,
              p.current_chapter_id, p.current_lesson_id, p.current_view
       FROM user_course_progress p
       JOIN courses co ON co.id = p.course_id
       WHERE p.user_id = $1 AND co.organization_id = $2`,
      [userId, organizationId],
    );

    // Leçons terminées, rattachées à leur formation.
    const { rows: lessonRows } = await query<{ lesson_id: string; course_id: string }>(
      `SELECT p.lesson_id, ch.course_id
       FROM user_lesson_progress p
       JOIN lessons l ON l.id = p.lesson_id
       JOIN chapters ch ON ch.id = l.chapter_id
       JOIN courses co ON co.id = ch.course_id
       WHERE p.user_id = $1 AND co.organization_id = $2`,
      [userId, organizationId],
    );

    const progress: GlobalProgress = {};

    for (const row of courseRows) {
      progress[row.course_id] = {
        ...emptyCourseProgress(),
        quizScores: row.quiz_scores ?? {},
        quizAttempts: row.quiz_attempts ?? {},
        quizAnswers: row.quiz_answers ?? {},
        currentChapterId: row.current_chapter_id,
        currentLessonId: row.current_lesson_id,
        currentView: row.current_view === 'quiz' ? 'quiz' : 'lesson',
      };
    }

    for (const row of lessonRows) {
      // Une leçon peut être terminée sans qu'aucune ligne de progression de
      // formation n'existe (parcours direct vers une leçon).
      const course = (progress[row.course_id] ??= emptyCourseProgress());
      course.completedLessons.add(row.lesson_id);
    }

    return progress;
  }

  async saveCourse(scope: OrgScope, courseId: string, progress: CourseProgress): Promise<void> {
    const { organizationId, userId } = assertScope(scope);

    // Vérifie que la formation appartient bien à l'organisation : sans ce
    // contrôle, on écrirait la progression d'un apprenant sur le contenu d'une
    // autre organisation.
    const owner = await query<{ id: string }>(
      'SELECT id FROM courses WHERE organization_id = $1 AND id = $2',
      [organizationId, courseId],
    );
    if (owner.rows.length === 0) {
      throw new Error(
        `Formation "${courseId}" introuvable dans cette organisation : progression refusée.`,
      );
    }

    const lessonIds = [...progress.completedLessons];

    await withTransaction(async (client) => {
      // 1. Position, scores et réponses.
      await client.query(
        `INSERT INTO user_course_progress (
           user_id, course_id, quiz_scores, quiz_attempts, quiz_answers,
           current_chapter_id, current_lesson_id, current_view, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (user_id, course_id) DO UPDATE SET
           quiz_scores = EXCLUDED.quiz_scores,
           quiz_attempts = EXCLUDED.quiz_attempts,
           quiz_answers = EXCLUDED.quiz_answers,
           current_chapter_id = EXCLUDED.current_chapter_id,
           current_lesson_id = EXCLUDED.current_lesson_id,
           current_view = EXCLUDED.current_view,
           updated_at = NOW()`,
        [
          userId,
          courseId,
          JSON.stringify(progress.quizScores ?? {}),
          JSON.stringify(progress.quizAttempts ?? {}),
          JSON.stringify(progress.quizAnswers ?? {}),
          progress.currentChapterId,
          progress.currentLessonId,
          progress.currentView === 'quiz' ? 'quiz' : 'lesson',
        ],
      );

      // 2. Leçons RETIRÉES de la liste : elles ne doivent plus compter comme
      //    terminées. Sans ce retrait, décocher une leçon la laisserait validée
      //    en base — l'affichage et la réalité divergeraient.
      await client.query(
        `DELETE FROM user_lesson_progress
         WHERE user_id = $1
           AND lesson_id IN (
             SELECT l.id FROM lessons l
             JOIN chapters ch ON ch.id = l.chapter_id
             WHERE ch.course_id = $2
           )
           AND NOT (lesson_id = ANY($3::text[]))`,
        [userId, courseId, lessonIds],
      );

      // 3. Leçons AJOUTÉES. Le filtre sur `ch.course_id` garantit qu'on ne peut
      //    pas valider une leçon d'une autre formation en la glissant dans la
      //    liste. `ON CONFLICT DO NOTHING` préserve la date de première
      //    complétion, qui sert à l'historique.
      await client.query(
        `INSERT INTO user_lesson_progress (user_id, lesson_id, completed_at)
         SELECT $1, l.id, NOW()
         FROM lessons l
         JOIN chapters ch ON ch.id = l.chapter_id
         WHERE ch.course_id = $2 AND l.id = ANY($3::text[])
         ON CONFLICT (user_id, lesson_id) DO NOTHING`,
        [userId, courseId, lessonIds],
      );
    });
  }

  async lessonBelongsToOrganization(scope: OrgScope, lessonId: string): Promise<boolean> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<{ id: string }>(
      `SELECT l.id FROM lessons l
       JOIN chapters ch ON ch.id = l.chapter_id
       JOIN courses co ON co.id = ch.course_id
       WHERE co.organization_id = $1 AND l.id = $2`,
      [organizationId, lessonId],
    );

    return rows.length > 0;
  }
}

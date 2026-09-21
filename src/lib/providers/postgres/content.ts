import { query } from '@/lib/db/pool';
import type { CourseInfo } from '@/types/course.types';
import type { Lesson, Quiz } from '@/types/tutorial.types';
import type { SubscriptionPlan } from '@/types/plans.types';
import { assertScope, type OrgScope } from '../types';
import type { ChapterWithLessons, ContentProvider } from '../content';

/**
 * Contenu pédagogique en PostgreSQL.
 *
 * RÈGLE D'ISOLATION : chaque requête filtre par `organization_id`. Pour les
 * entités de contenu, le filtre passe par la formation propriétaire
 * (`chapters` → `courses`, `lessons` → `chapters` → `courses`), car seul
 * `courses` porte directement `organization_id`.
 */

type CourseRow = {
  id: string;
  title: string;
  description: string;
  status: CourseInfo['status'];
  plan: unknown | null;
  generation_params: unknown | null;
}

type ChapterRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  week_id: string | null;
  position: number;
  unlock_rule_id: string | null;
}

type LessonRow = {
  id: string;
  chapter_id: string;
  source_id: string | null;
  title: string;
  objective: string;
  content: string;
  type: string;
  duration_minutes: number | null;
  points: number;
  media_ref: unknown | null;
  interactive_component_name: string | null;
  visual_component_name: string | null;
  position: number;
}

function toCourseInfo(row: CourseRow): CourseInfo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    plan: (row.plan ?? undefined) as CourseInfo['plan'],
    generationParams: (row.generation_params ?? undefined) as CourseInfo['generationParams'],
  };
}

function toLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    title: row.title,
    objective: row.objective,
    content: row.content,
    interactiveComponentName: row.interactive_component_name ?? undefined,
    visualComponentName: row.visual_component_name ?? undefined,
  };
}

export class PostgresContentProvider implements ContentProvider {
  // --- Formations -----------------------------------------------------------

  async listCourses(scope: OrgScope): Promise<CourseInfo[]> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<CourseRow>(
      `SELECT id, title, description, status, plan, generation_params
       FROM courses
       WHERE organization_id = $1
       ORDER BY created_at, id`,
      [organizationId],
    );

    return rows.map(toCourseInfo);
  }

  async getCourse(scope: OrgScope, id: string): Promise<CourseInfo | null> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<CourseRow>(
      `SELECT id, title, description, status, plan, generation_params
       FROM courses
       WHERE organization_id = $1 AND id = $2`,
      [organizationId, id],
    );

    return rows[0] ? toCourseInfo(rows[0]) : null;
  }

  async saveCourses(scope: OrgScope, courses: CourseInfo[]): Promise<void> {
    const { organizationId } = assertScope(scope);

    for (const course of courses) {
      await query(
        `INSERT INTO courses (id, organization_id, title, description, status, plan, generation_params)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, description = EXCLUDED.description,
           status = EXCLUDED.status, plan = EXCLUDED.plan,
           generation_params = EXCLUDED.generation_params
         WHERE courses.organization_id = EXCLUDED.organization_id`,
        [
          course.id, organizationId, course.title, course.description ?? '',
          course.status ?? 'Brouillon',
          course.plan ? JSON.stringify(course.plan) : null,
          course.generationParams ? JSON.stringify(course.generationParams) : null,
        ],
      );
    }
  }

  async createCourse(scope: OrgScope, course: Omit<CourseInfo, 'id'>): Promise<CourseInfo> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<{ id: string }>(
      `INSERT INTO courses (id, organization_id, title, description, status, plan, generation_params)
       VALUES (
         COALESCE($1, regexp_replace(lower($2), '[^a-z0-9]+', '-', 'g')),
         $3, $2, $4, $5, $6, $7
       )
       RETURNING id`,
      [
        null, course.title, organizationId, course.description ?? '',
        course.status ?? 'Brouillon',
        course.plan ? JSON.stringify(course.plan) : null,
        course.generationParams ? JSON.stringify(course.generationParams) : null,
      ],
    );

    return { ...course, id: rows[0].id };
  }

  async updateCourse(scope: OrgScope, id: string, changes: Partial<CourseInfo>): Promise<void> {
    const { organizationId } = assertScope(scope);

    await query(
      `UPDATE courses SET
         title = COALESCE($3, title),
         description = COALESCE($4, description),
         status = COALESCE($5, status),
         plan = COALESCE($6, plan),
         generation_params = COALESCE($7, generation_params)
       WHERE organization_id = $1 AND id = $2`,
      [
        organizationId, id,
        changes.title ?? null, changes.description ?? null, changes.status ?? null,
        changes.plan ? JSON.stringify(changes.plan) : null,
        changes.generationParams ? JSON.stringify(changes.generationParams) : null,
      ],
    );
  }

  async deleteCourse(scope: OrgScope, id: string): Promise<void> {
    const { organizationId } = assertScope(scope);
    // Les chapitres, leçons et quiz suivent par ON DELETE CASCADE.
    await query('DELETE FROM courses WHERE organization_id = $1 AND id = $2', [organizationId, id]);
  }

  // --- Chapitres et leçons ---------------------------------------------------

  async listChapters(scope: OrgScope, courseId?: string): Promise<ChapterWithLessons[]> {
    const { organizationId } = assertScope(scope);

    const { rows: chapters } = await query<ChapterRow>(
      `SELECT ch.id, ch.course_id, ch.title, ch.description, ch.week_id, ch.position, ch.unlock_rule_id
       FROM chapters ch
       JOIN courses co ON co.id = ch.course_id
       WHERE co.organization_id = $1
         AND ($2::text IS NULL OR ch.course_id = $2)
       ORDER BY ch.course_id, ch.position`,
      [organizationId, courseId ?? null],
    );

    if (chapters.length === 0) return [];

    const { rows: lessons } = await query<LessonRow>(
      `SELECT l.id, l.chapter_id, l.source_id, l.title, l.objective, l.content, l.type,
              l.duration_minutes, l.points, l.media_ref,
              l.interactive_component_name, l.visual_component_name, l.position
       FROM lessons l
       JOIN chapters ch ON ch.id = l.chapter_id
       JOIN courses co ON co.id = ch.course_id
       WHERE co.organization_id = $1
         AND ($2::text IS NULL OR ch.course_id = $2)
       ORDER BY l.chapter_id, l.position`,
      [organizationId, courseId ?? null],
    );

    const lessonsByChapter = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const list = lessonsByChapter.get(lesson.chapter_id) ?? [];
      list.push(toLesson(lesson));
      lessonsByChapter.set(lesson.chapter_id, list);
    }

    return chapters.map((chapter) => ({
      id: chapter.id,
      courseId: chapter.course_id,
      title: chapter.title,
      description: chapter.description,
      weekId: chapter.week_id,
      position: chapter.position,
      unlockRuleId: chapter.unlock_rule_id,
      lessons: lessonsByChapter.get(chapter.id) ?? [],
    }));
  }

  async getChapter(scope: OrgScope, id: string): Promise<ChapterWithLessons | null> {
    const all = await this.listChapters(scope);
    return all.find((chapter) => chapter.id === id) ?? null;
  }

  /** Décalage temporaire libérant la plage de positions 0..n. Doit rester > au
   * nombre réel d'éléments (un chapitre compte quelques dizaines de leçons). */
  private static readonly POSITION_OFFSET = 10000;

  async saveChapters(scope: OrgScope, chapters: ChapterWithLessons[]): Promise<void> {
    const { organizationId } = assertScope(scope);

    // La position est relative à la formation : on traite formation par formation.
    const byCourse = new Map<string, ChapterWithLessons[]>();
    for (const chapter of chapters) {
      const list = byCourse.get(chapter.courseId) ?? [];
      list.push(chapter);
      byCourse.set(chapter.courseId, list);
    }

    for (const [courseId, courseChapters] of byCourse) {
      // Vérifie que la formation cible appartient bien à l'organisation.
      const owner = await query<{ id: string }>(
        'SELECT id FROM courses WHERE organization_id = $1 AND id = $2',
        [organizationId, courseId],
      );
      if (owner.rows.length === 0) {
        throw new Error(
          `Formation "${courseId}" introuvable dans cette organisation : écriture refusée.`,
        );
      }

      // `UNIQUE (course_id, position)` est vérifiée à chaque instruction : on
      // décale d'abord tout le monde, puis on repose les positions définitives.
      // Cela évite une contrainte DEFERRABLE et une transaction explicite.
      await query(
        'UPDATE chapters SET position = position + $2 WHERE course_id = $1',
        [courseId, PostgresContentProvider.POSITION_OFFSET],
      );

      for (const [index, chapter] of courseChapters.entries()) {
        await query(
          `INSERT INTO chapters (id, course_id, week_id, title, description, position, unlock_rule_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             course_id = EXCLUDED.course_id, week_id = EXCLUDED.week_id,
             title = EXCLUDED.title, description = EXCLUDED.description,
             position = EXCLUDED.position, unlock_rule_id = EXCLUDED.unlock_rule_id`,
          [
            chapter.id, courseId, chapter.weekId, chapter.title,
            chapter.description ?? '', index, chapter.unlockRuleId,
          ],
        );

        await this.saveLessons(chapter.id, chapter.lessons);
      }

      // Chapitres absents de la liste : conservés, repoussés à la suite plutôt
      // que supprimés (leur suppression emporterait leurs quiz et la
      // progression des apprenants — voir user_lesson_progress).
      await query(
        `WITH leftovers AS (
           SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS rn
           FROM chapters
           WHERE course_id = $1 AND position >= $3
         )
         UPDATE chapters c SET position = $2 + l.rn - 1
         FROM leftovers l
         WHERE c.id = l.id`,
        [courseId, courseChapters.length, PostgresContentProvider.POSITION_OFFSET],
      );
    }
  }

  /**
   * Écrit les leçons d'un chapitre **sans les supprimer**.
   *
   * ⚠️ Ne jamais revenir à un `DELETE` puis réinsertion : `user_lesson_progress`
   * référence `lessons(id)` avec `ON DELETE CASCADE`, et une simple édition de
   * contenu effacerait la progression des apprenants.
   */
  private async saveLessons(chapterId: string, lessons: Lesson[]): Promise<void> {
    await query(
      'UPDATE lessons SET position = position + $2 WHERE chapter_id = $1',
      [chapterId, PostgresContentProvider.POSITION_OFFSET],
    );

    for (const [index, lesson] of lessons.entries()) {
      // `type` et `points` ne figurent pas dans `Lesson` : ils sont posés à la
      // création et **préservés** en mise à jour (absents du DO UPDATE).
      await query(
        `INSERT INTO lessons (
           id, chapter_id, source_id, title, objective, content, type, points,
           interactive_component_name, visual_component_name, position
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'TEXTE', 0, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           chapter_id = EXCLUDED.chapter_id,
           title = EXCLUDED.title,
           objective = EXCLUDED.objective,
           content = EXCLUDED.content,
           interactive_component_name = EXCLUDED.interactive_component_name,
           visual_component_name = EXCLUDED.visual_component_name,
           position = EXCLUDED.position`,
        [
          lesson.id, chapterId, null, lesson.title, lesson.objective ?? '',
          lesson.content ?? '', lesson.interactiveComponentName ?? null,
          lesson.visualComponentName ?? null, index,
        ],
      );
    }

    await query(
      `WITH leftovers AS (
         SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS rn
         FROM lessons
         WHERE chapter_id = $1 AND position >= $3
       )
       UPDATE lessons l SET position = $2 + r.rn - 1
       FROM leftovers r
       WHERE l.id = r.id`,
      [chapterId, lessons.length, PostgresContentProvider.POSITION_OFFSET],
    );
  }

  async deleteChapter(scope: OrgScope, id: string): Promise<void> {
    const { organizationId } = assertScope(scope);

    await query(
      `DELETE FROM chapters ch
       USING courses co
       WHERE ch.id = $2 AND co.id = ch.course_id AND co.organization_id = $1`,
      [organizationId, id],
    );
  }

  // --- Quiz ------------------------------------------------------------------

  async listQuizMap(scope: OrgScope): Promise<Record<string, Quiz>> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<{
      id: string; chapter_id: string; title: string; passing_score: number;
      feedback_timing: string | null; questions: unknown;
    }>(
      `SELECT q.id, q.chapter_id, q.title, q.passing_score, q.feedback_timing,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', qu.id,
                    'text', qu.text,
                    'isMultipleChoice', qu.is_multiple_choice,
                    'answers', COALESCE((
                      SELECT json_agg(json_build_object(
                        'id', a.id, 'text', a.text, 'isCorrect', a.is_correct
                      ) ORDER BY a.position)
                      FROM answers a WHERE a.question_id = qu.id
                    ), '[]'::json)
                  ) ORDER BY qu.position
                ) FILTER (WHERE qu.id IS NOT NULL),
                '[]'::json
              ) AS questions
       FROM quizzes q
       JOIN chapters ch ON ch.id = q.chapter_id
       JOIN courses co ON co.id = ch.course_id
       LEFT JOIN questions qu ON qu.quiz_id = q.id
       WHERE co.organization_id = $1
       GROUP BY q.id, q.chapter_id, q.title, q.passing_score, q.feedback_timing`,
      [organizationId],
    );

    const map: Record<string, Quiz> = {};
    for (const row of rows) {
      map[row.chapter_id] = {
        id: row.id,
        title: row.title,
        passingScore: row.passing_score,
        feedbackTiming: (row.feedback_timing ?? 'end') as Quiz['feedbackTiming'],
        questions: (row.questions ?? []) as Quiz['questions'],
      };
    }
    return map;
  }

  async getQuiz(scope: OrgScope, id: string): Promise<Quiz | null> {
    const map = await this.listQuizMap(scope);
    return map[id] ?? null;
  }

  async saveQuizMap(scope: OrgScope, quizzes: Record<string, Quiz>): Promise<void> {
    const { organizationId } = assertScope(scope);

    for (const [chapterId, quiz] of Object.entries(quizzes)) {
      const owner = await query<{ id: string }>(
        `SELECT ch.id FROM chapters ch
         JOIN courses co ON co.id = ch.course_id
         WHERE co.organization_id = $1 AND ch.id = $2`,
        [organizationId, chapterId],
      );
      if (owner.rows.length === 0) {
        throw new Error(
          `Chapitre "${chapterId}" introuvable dans cette organisation : écriture du quiz refusée.`,
        );
      }

      await query(
        `INSERT INTO quizzes (id, chapter_id, title, passing_score, feedback_timing)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, passing_score = EXCLUDED.passing_score,
           feedback_timing = EXCLUDED.feedback_timing`,
        [quiz.id, chapterId, quiz.title, quiz.passingScore ?? 80, quiz.feedbackTiming ?? 'end'],
      );

      await query('DELETE FROM questions WHERE quiz_id = $1', [quiz.id]);

      for (const [questionIndex, question] of (quiz.questions ?? []).entries()) {
        await query(
          `INSERT INTO questions (id, quiz_id, text, is_multiple_choice, position)
           VALUES ($1, $2, $3, $4, $5)`,
          [question.id, quiz.id, question.text, question.isMultipleChoice ?? false, questionIndex],
        );

        for (const [answerIndex, answer] of (question.answers ?? []).entries()) {
          await query(
            `INSERT INTO answers (id, question_id, text, is_correct, position)
             VALUES ($1, $2, $3, $4, $5)`,
            [answer.id, question.id, answer.text, answer.isCorrect ?? false, answerIndex],
          );
        }
      }
    }
  }

  async deleteQuiz(scope: OrgScope, id: string): Promise<void> {
    const { organizationId } = assertScope(scope);

    await query(
      `DELETE FROM quizzes q
       USING chapters ch, courses co
       WHERE q.id = $2 AND ch.id = q.chapter_id AND co.id = ch.course_id
         AND co.organization_id = $1`,
      [organizationId, id],
    );
  }

  // --- Formules --------------------------------------------------------------

  /**
   * Les formules sont un **catalogue global** (comme un catalogue produit) :
   * `organizations.plan_id` y référence une offre. Le `scope` est conservé pour
   * l'uniformité de l'interface et pour permettre, plus tard, des offres
   * propres à une organisation.
   */
  async listPlans(scope: OrgScope): Promise<SubscriptionPlan[]> {
    assertScope(scope);

    const { rows } = await query<{
      id: string; name: string; description: string | null; price: string;
      billing_period: string; features: unknown; courses: unknown; cta: string | null;
      recommended: boolean;
    }>(
      `SELECT id, name, description, price, billing_period, features, courses, cta, recommended
       FROM plans ORDER BY position`,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      price: Number(row.price),
      billingPeriod: row.billing_period,
      features: (row.features ?? []) as string[],
      courses: (row.courses ?? []) as string[],
      cta: row.cta ?? '',
      recommended: row.recommended,
    })) as SubscriptionPlan[];
  }

  async upsertPlan(scope: OrgScope, plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    assertScope(scope);

    // `position` est volontairement absent du DO UPDATE : il fixe l'ordre
    // d'affichage du catalogue et ne doit pas être réinitialisé par une édition.
    await query(
      `INSERT INTO plans (id, name, description, price, billing_period, features, courses, cta, recommended)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         price = EXCLUDED.price,
         billing_period = EXCLUDED.billing_period,
         features = EXCLUDED.features,
         courses = EXCLUDED.courses,
         cta = EXCLUDED.cta,
         recommended = EXCLUDED.recommended`,
      [
        plan.id, plan.name, plan.description ?? '', plan.price ?? 0,
        plan.billingPeriod ?? 'monthly', JSON.stringify(plan.features ?? []),
        JSON.stringify(plan.courses ?? []), plan.cta ?? '', plan.recommended ?? false,
      ],
    );

    return plan;
  }

  async deletePlan(scope: OrgScope, id: string): Promise<void> {
    assertScope(scope);
    await query('DELETE FROM plans WHERE id = $1', [id]);
  }
}

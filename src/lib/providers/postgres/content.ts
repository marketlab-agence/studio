import { query, withTransaction } from '@/lib/db/pool';
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
    content_domain: string | null;
    language: CourseInfo['language'];
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
    /**
     * Composants ordonnés, agrégés depuis `lesson_components`.
     *
     * ⚠️ **La nature (`interactive`/`visual`) n'est pas dans la donnée** : elle vient
     * du catalogue (`resolveComponentMeta`). La dupliquer ici créerait deux vérités.
     */
    components: { id: string; name: string; position: number; config: unknown }[];
    position: number;
    /**
     * Niveau de Bloom de la leçon, ou `null` en base.
     *
     * ⚠️ **Sa présence ici est indispensable** : sans elle, `toLesson` retombait sur
     * `undefined` et la sélection par Bloom devenait un no-op silencieux.
     */
    bloom_level: string | null;
  }

function toCourseInfo(row: CourseRow): CourseInfo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    plan: (row.plan ?? undefined) as CourseInfo['plan'],
      generationParams: (row.generation_params ?? undefined) as CourseInfo['generationParams'],
      contentDomain: row.content_domain,
      language: row.language,
    };
  }

  function toLesson(row: LessonRow): Lesson {
    return {
      id: row.id,
      title: row.title,
      objective: row.objective,
      content: row.content,
      components: (row.components ?? []).map((composant) => ({
        // ⚠️ `id` propagé jusqu'ici : c'est lui que `LessonView` transmet aux composants,
        // qui le joignent à leurs traces (`lesson_component_id`). Sans lui, deux instances
        // du même composant seraient indiscernables en audit.
        id: composant.id,
        name: composant.name,
        position: composant.position,
        config: (composant.config ?? {}) as Lesson['components'][number]['config'],
      })),
      // ⚠️ **Champs relus fidèlement.** Les omettre rendait la leçon infidèle : le niveau
      // de Bloom disparaissait (sélection Bloom inopérante) et l'écriture suivante,
      // dépourvue du niveau, le réécrivait à `null` (d'où le `COALESCE` ci-dessous).
      type: row.type,
      points: row.points,
      position: row.position,
      bloomLevel: row.bloom_level ?? undefined,
    };
  }

/**
 * Exécuteur SQL : le pool partagé **ou** une connexion de transaction.
 *
 * ⚠️ **L'indirection est ce qui rend l'écriture atomique possible** : une méthode privée qui
 * n'appelle que `query()` ignore la transaction ouverte par son appelant. En recevant l'exécuteur,
 * `remplacerComposants` participe réellement au « tout ou rien » de `saveLessons`.
 * Aucune de ces méthodes ne lit `rows` : `unknown` suffit comme type de retour.
 */
type SqlRunner = (text: string, params?: unknown[]) => Promise<unknown>;

export class PostgresContentProvider implements ContentProvider {
  // --- Formations -----------------------------------------------------------

  async listCourses(scope: OrgScope): Promise<CourseInfo[]> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<CourseRow>(
      `SELECT id, title, description, status, plan, generation_params, content_domain, language
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
      `SELECT id, title, description, status, plan, generation_params, content_domain, language
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
        `INSERT INTO courses (id, organization_id, title, description, status, plan, generation_params, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, description = EXCLUDED.description,
           status = EXCLUDED.status, plan = EXCLUDED.plan,
           generation_params = EXCLUDED.generation_params,
           language = EXCLUDED.language
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
      `INSERT INTO courses (id, organization_id, title, description, status, plan, generation_params, language)
       VALUES (
         COALESCE($1, regexp_replace(lower($2), '[^a-z0-9]+', '-', 'g')),
         $3, $2, $4, $5, $6, $7, $8
       )
       RETURNING id`,
      [
        null, course.title, organizationId, course.description ?? '',
        course.status ?? 'Brouillon',
        course.plan ? JSON.stringify(course.plan) : null,
        course.generationParams ? JSON.stringify(course.generationParams) : null,
        course.language ?? 'fr',
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
         generation_params = COALESCE($7, generation_params),
         language = COALESCE($8, language)
       WHERE organization_id = $1 AND id = $2`,
      [
        organizationId, id,
        changes.title ?? null, changes.description ?? null, changes.status ?? null,
        changes.plan ? JSON.stringify(changes.plan) : null,
        changes.generationParams ? JSON.stringify(changes.generationParams) : null,
        changes.language ?? null,
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
                l.duration_minutes, l.points, l.media_ref, l.position, l.bloom_level,
                COALESCE(
                  (SELECT json_agg(json_build_object(
                     'id', lc.id,
                     'name', lc.component_name,
                     'position', lc.position,
                     'config', lc.config
                   ) ORDER BY lc.position)
                   FROM lesson_components lc WHERE lc.lesson_id = l.id),
                  '[]'::json
                ) AS components
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
    // ⚠️ **Tout ou rien.** Le décalage des positions (+10000), les upserts de leçons, la réécriture
    // des composants et la repose des positions forment une seule unité. Sans transaction, une
    // erreur en cours de boucle laissait des leçons à `position >= 10000` (donc en fin de chapitre)
    // et des composants à moitié remplacés — un état incohérent non détecté.
    await withTransaction(async (client) => {
      const run: SqlRunner = (text, params) => client.query(text, params);

      await run(
        'UPDATE lessons SET position = position + $2 WHERE chapter_id = $1',
        [chapterId, PostgresContentProvider.POSITION_OFFSET],
      );

      for (const [index, lesson] of lessons.entries()) {
        // `type` et `points` sont initialisés à la création et **préservés** en mise à jour
        // (absents du `DO UPDATE`) : la relecture les expose, mais l'écriture ne les écrase pas.
        //
        // ⚠️ **`bloom_level` en `COALESCE`.** Un appelant qui omet le niveau (génération
        // ancienne, ou leçon non encore alignée) ne doit PAS le remettre à NULL : le niveau
        // en base est la source de vérité, et l'effacer ferait perdre un travail d'alignement.
        await run(
          `INSERT INTO lessons (
             id, chapter_id, source_id, title, objective, content, type, points,
             bloom_level, position
           )
           VALUES ($1, $2, $3, $4, $5, $6, 'TEXTE', 0, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             chapter_id = EXCLUDED.chapter_id,
             title = EXCLUDED.title,
             objective = EXCLUDED.objective,
             content = EXCLUDED.content,
             bloom_level = COALESCE(EXCLUDED.bloom_level, lessons.bloom_level),
             position = EXCLUDED.position`,
          [
            lesson.id, chapterId, null, lesson.title, lesson.objective ?? '',
            lesson.content ?? '', lesson.bloomLevel ?? null, index,
          ],
        );

        // ⚠️ Les composants vivent dans leur propre table : ils sont réécrits APRÈS
        // la leçon, dont ils dépendent par clé étrangère.
        await this.remplacerComposants(run, lesson.id, lesson.components ?? []);
      }

      await run(
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
    });
  }

  /**
   * Réécrit les composants d'une leçon.
   *
   * ⚠️ **L'`id` d'un composant est réutilisé quand c'est le MÊME composant**, car
   * `lesson_interactions.lesson_component_id` le référence : le recréer
   * orphelinerait l'historique d'apprentissage.
   *
   * ⚠️ **Mais pas s'il a changé de nom.** Réutiliser l'`id` d'un `RecallQuiz`
   * devenu `MatchingPairs` ferait croire que les traces passées appartiennent au
   * nouveau composant — une fausse attribution, pire qu'une perte. Dans ce cas on
   * supprime (la trace passe à `NULL`) puis on insère un composant neuf.
   */
  private async remplacerComposants(
    run: SqlRunner,
    lessonId: string,
    composants: Lesson['components'],
  ): Promise<void> {
    // ⚠️ **L'ordre du tableau est autoritaire ; les positions sont normalisées 0..N-1.**
    // Faire confiance à la `position` fournie laissait des trous (ex. `[0, 2]` après retrait d'un
    // composant en milieu de leçon), et rien ne garantissait que les positions forment une plage
    // continue. Ici, comme pour les leçons (`saveLessons` utilise aussi l'index), la position en
    // base est l'index du tableau : la relecture trie déjà par `position`, donc l'ordre rendu est
    // inchangé, mais la numérotation ne peut plus comporter de trou.
    const positions = composants.map((_composant, index) => index);

    // ⚠️ `<> ALL('{}')` vaut VRAI partout : une liste vide supprime donc bien tous
    // les composants de la leçon, ce qui est le comportement attendu.
    await run(
      `DELETE FROM lesson_components WHERE lesson_id = $1 AND position <> ALL($2::int[])`,
      [lessonId, positions],
    );

    for (const [position, composant] of composants.entries()) {
      await run(
        `DELETE FROM lesson_components
         WHERE lesson_id = $1 AND position = $2 AND component_name <> $3`,
        [lessonId, position, composant.name],
      );

      await run(
        `INSERT INTO lesson_components (lesson_id, component_name, position, config)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lesson_id, position) DO UPDATE SET config = EXCLUDED.config`,
        [lessonId, composant.name, position, JSON.stringify(composant.config ?? {})],
      );
    }
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

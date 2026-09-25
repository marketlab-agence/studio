import {
  emptyCourseProgress,
  getProgressProvider,
  resetProviders,
  type OrgScope,
  type ProgressProvider,
} from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Progression (T5.1, REQ-PROG-01/02).
 *
 * Ce que ces tests verrouillent, et pourquoi :
 *
 * - **la persistance existe** — c'était la régression de la phase 4 : la
 *   progression était restée en mémoire après la sortie de Firestore ;
 * - **décocher retire réellement** — sans le retrait, une leçon décochée
 *   resterait comptée comme terminée en base et l'affichage mentirait ;
 * - **l'isolation tient** — la progression est nominative : un apprenant ne doit
 *   ni lire ni écrire celle d'un autre, ni celle d'une autre organisation ;
 * - **le point de reprise est conservé** (REQ-PROG-02).
 */

jest.setTimeout(90_000);

const ORG_B_SLUG = 'progress-org-b';

let provider: ProgressProvider;
let scopeA: OrgScope;
let scopeB: OrgScope;
let courseId: string;
let lessonIds: string[];
let chapterId: string;

async function prepare(): Promise<boolean> {
  const { rows } = await pool.query<{ organization_id: string; user_id: string; role: string }>(
    `SELECT o.id AS organization_id, u.id AS user_id, u.role
     FROM organizations o JOIN users u ON u.organization_id = o.id
     ORDER BY o.created_at LIMIT 1`,
  );
  if (rows.length === 0) return false;

  scopeA = {
    organizationId: rows[0].organization_id,
    userId: rows[0].user_id,
    role: rows[0].role as OrgScope['role'],
  };

  // ⚠️ **On cherche directement une PAIRE (cours, chapitre) valide**, et non un
  // cours puis son premier chapitre. Le test s'appuie sur `lessonIds[2]` : il lui
  // faut un chapitre d'**au moins 3 leçons**. Chercher le cours d'abord rendait le
  // test dépendant de l'ordre des lignes — un ordre que PostgreSQL ne garantit pas
  // sans `ORDER BY`, et qui change après un re-seed.
  const paire = await pool.query<{ course_id: string; chapter_id: string }>(
    `SELECT c.course_id, c.id AS chapter_id
     FROM chapters c
     JOIN courses co ON co.id = c.course_id
     WHERE co.organization_id = $1
       AND (SELECT COUNT(*) FROM lessons l WHERE l.chapter_id = c.id) >= 3
     ORDER BY co.created_at, c.position
     LIMIT 1`,
    [scopeA.organizationId],
  );
  if (paire.rows.length === 0) return false;
  courseId = paire.rows[0].course_id;
  chapterId = paire.rows[0].chapter_id;

  const lessons = await pool.query<{ id: string }>(
    'SELECT id FROM lessons WHERE chapter_id = $1 ORDER BY position LIMIT 3',
    [chapterId],
  );
  if (lessons.rows.length === 0) return false;
  lessonIds = lessons.rows.map((row) => row.id);

  // Seconde organisation, pour l'isolation.
  const created = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, slug) VALUES ('Org progression B', $1)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [ORG_B_SLUG],
  );
  const userB = await pool.query<{ id: string }>(
    `INSERT INTO users (organization_id, email, name, role)
     VALUES ($1, 'progress-b@example.com', 'Apprenant B', 'Utilisateur')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [created.rows[0].id],
  );

  scopeB = {
    organizationId: created.rows[0].id,
    userId: userB.rows[0].id,
    role: 'Utilisateur',
  };
  return true;
}

async function cleanup(): Promise<void> {
  await pool.query('DELETE FROM organizations WHERE slug = $1', [ORG_B_SLUG]);
  await pool.query('DELETE FROM user_lesson_progress WHERE user_id = $1', [scopeA.userId]);
  await pool.query('DELETE FROM user_course_progress WHERE user_id = $1', [scopeA.userId]);
}

describe('PostgresProgressProvider', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    if (!(await prepare())) throw new Error('Base non seedée.');
    provider = getProgressProvider();
  });

  afterEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  describe('lecture initiale', () => {
    it('retourne une progression vide pour un nouvel apprenant', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await provider.getAll(scopeA)).toEqual({});
    });
  });

  describe('persistance', () => {
    it('enregistre et relit les leçons terminées', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        completedLessons: new Set([lessonIds[0], lessonIds[1]]),
      });

      const progress = await provider.getAll(scopeA);

      expect([...progress[courseId].completedLessons].sort()).toEqual(
        [lessonIds[0], lessonIds[1]].sort(),
      );
    });

    it('enregistre et relit les scores de quiz', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        quizScores: { [chapterId]: 85 },
        quizAttempts: { [chapterId]: 2 },
        quizAnswers: { [chapterId]: { q1: ['a1'], q2: ['a2', 'a3'] } },
      });

      const course = (await provider.getAll(scopeA))[courseId];

      expect(course.quizScores[chapterId]).toBe(85);
      expect(course.quizAttempts[chapterId]).toBe(2);
      expect(course.quizAnswers[chapterId].q2).toEqual(['a2', 'a3']);
    });

    it('RETIRE une leçon décochée', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        completedLessons: new Set([lessonIds[0], lessonIds[1]]),
      });

      // Décocher la seconde : elle ne doit plus compter comme terminée.
      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        completedLessons: new Set([lessonIds[0]]),
      });

      const course = (await provider.getAll(scopeA))[courseId];
      expect([...course.completedLessons]).toEqual([lessonIds[0]]);

      // Vérifié aussi directement en base : sans le retrait, la ligne
      // subsisterait et fausserait les statistiques.
      const { rows } = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM user_lesson_progress WHERE user_id = $1',
        [scopeA.userId],
      );
      expect(Number(rows[0].count)).toBe(1);
    });

    it('conserve la date de première complétion lors d’un réenregistrement', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        completedLessons: new Set([lessonIds[0]]),
      });

      const first = await pool.query<{ completed_at: Date }>(
        'SELECT completed_at FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2',
        [scopeA.userId, lessonIds[0]],
      );

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        completedLessons: new Set([lessonIds[0]]),
      });

      const second = await pool.query<{ completed_at: Date }>(
        'SELECT completed_at FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2',
        [scopeA.userId, lessonIds[0]],
      );

      // La date d'origine est l'historique de l'apprenant : elle ne doit pas
      // être réécrite à chaque enregistrement.
      expect(second.rows[0].completed_at).toEqual(first.rows[0].completed_at);
    });

    it('ne valide pas une leçon appartenant à une autre formation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // Une leçon d'une AUTRE formation est glissée dans la liste.
      const other = await pool.query<{ id: string }>(
        `SELECT l.id FROM lessons l
         JOIN chapters ch ON ch.id = l.chapter_id
         WHERE ch.course_id <> $1 LIMIT 1`,
        [courseId],
      );

      if (other.rows.length === 0) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        completedLessons: new Set([other.rows[0].id]),
      });

      const { rows } = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM user_lesson_progress WHERE user_id = $1',
        [scopeA.userId],
      );

      // Le filtre sur `ch.course_id` empêche de valider un contenu hors de la
      // formation visée.
      expect(Number(rows[0].count)).toBe(0);
    });
  });

  describe('point de reprise (REQ-PROG-02)', () => {
    it('conserve où l’apprenant s’est arrêté', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        currentChapterId: chapterId,
        currentLessonId: lessonIds[2],
        currentView: 'lesson',
      });

      const course = (await provider.getAll(scopeA))[courseId];

      expect(course.currentChapterId).toBe(chapterId);
      expect(course.currentLessonId).toBe(lessonIds[2]);
      expect(course.currentView).toBe('lesson');
    });

    it('conserve la vue courante, y compris « quiz »', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        currentChapterId: chapterId,
        currentView: 'quiz',
      });

      expect((await provider.getAll(scopeA))[courseId].currentView).toBe('quiz');
    });
  });

  describe('isolation', () => {
    it('refuse d’enregistrer la progression d’une formation d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(
        provider.saveCourse(scopeB, courseId, {
          ...emptyCourseProgress(),
          completedLessons: new Set([lessonIds[0]]),
        }),
      ).rejects.toThrow(/introuvable dans cette organisation/);
    });

    it('ne lit que sa propre progression', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.saveCourse(scopeA, courseId, {
        ...emptyCourseProgress(),
        completedLessons: new Set([lessonIds[0]]),
      });

      // L'organisation B n'a aucune progression, et surtout pas celle de A.
      expect(await provider.getAll(scopeB)).toEqual({});
    });

    it('vérifie l’appartenance d’une leçon à l’organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await provider.lessonBelongsToOrganization(scopeA, lessonIds[0])).toBe(true);
      expect(await provider.lessonBelongsToOrganization(scopeB, lessonIds[0])).toBe(false);
    });
  });
});

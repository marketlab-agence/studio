import { getContentProvider, resetProviders, type OrgScope } from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Contrat ContentProvider contre une vraie base PostgreSQL.
 *
 * Deux régressions sont spécifiquement verrouillées ici :
 *
 * 1. **Perte de la description de chapitre.** `chapters.description` alimente
 *    `ChapterWithLessons.description` (ancien champ `tutorial.description`) :
 *    si la colonne disparaît du schéma ou de la requête, la donnée est perdue
 *    au premier enregistrement.
 *
 * 2. **Effacement de la progression.** `saveChapters` réécrit les leçons ; toute
 *    implémentation qui ferait `DELETE FROM lessons` avant de réinsérer
 *    emporterait `user_lesson_progress` (FK `ON DELETE CASCADE`) à chaque
 *    édition de contenu.
 */

let scope: OrgScope;

async function resolveScope(): Promise<boolean> {
  const { rows } = await pool.query<{ organization_id: string; user_id: string; role: string }>(
    `SELECT o.id AS organization_id, u.id AS user_id, u.role
     FROM organizations o JOIN users u ON u.organization_id = o.id
     ORDER BY o.created_at LIMIT 1`,
  );
  if (rows.length === 0) return false;

  scope = {
    organizationId: rows[0].organization_id,
    userId: rows[0].user_id,
    role: rows[0].role as OrgScope['role'],
  };
  return true;
}

describe('PostgresContentProvider', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    if (!(await resolveScope())) throw new Error('Base non seedée : `npm run db:seed:test`.');
  });

  it('lit les formations, chapitres, leçons et quiz seedés', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    const provider = getContentProvider();

    const courses = await provider.listCourses(scope);
    const chapters = await provider.listChapters(scope);
    const quizzes = await provider.listQuizMap(scope);

    expect(courses).toHaveLength(6);
    expect(chapters).toHaveLength(26);
    expect(chapters.reduce((total, ch) => total + ch.lessons.length, 0)).toBe(80);
    expect(Object.keys(quizzes)).toHaveLength(26);
  });

  it('conserve la description d’un chapitre au round-trip', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    const provider = getContentProvider();

    const [chapter] = await provider.listChapters(scope);
    await provider.saveChapters(scope, [
      { ...chapter, description: 'Description persistée' },
    ]);

    const [reloaded] = (await provider.listChapters(scope, chapter.courseId)).filter(
      (c) => c.id === chapter.id,
    );
    expect(reloaded.description).toBe('Description persistée');

    // Restauration.
    await provider.saveChapters(scope, [chapter]);
  });

  it('préserve la progression des apprenants lors d’une écriture de chapitres', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    const provider = getContentProvider();

    const chapter = (await provider.listChapters(scope)).find((c) => c.lessons.length > 0);
    if (!chapter) throw new Error('Aucun chapitre avec leçon dans le jeu de données de test.');
    const lessonId = chapter.lessons[0].id;

    // Un apprenant a terminé cette leçon.
    await pool.query(
      `INSERT INTO user_lesson_progress (user_id, lesson_id, completed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, lesson_id) DO NOTHING`,
      [scope.userId, lessonId],
    );

    const before = await pool.query('SELECT 1 FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [
      scope.userId, lessonId,
    ]);
    expect(before.rowCount).toBe(1);

    // Édition de contenu : leçon modifiée, puis enregistrement complet.
    await provider.saveChapters(scope, [
      {
        ...chapter,
        lessons: chapter.lessons.map((lesson, index) =>
          index === 0 ? { ...lesson, content: 'Contenu réécrit par le formateur' } : lesson,
        ),
      },
    ]);

    const after = await pool.query('SELECT 1 FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [
      scope.userId, lessonId,
    ]);
    expect(after.rowCount).toBe(1);

    // La leçon n'a pas été dupliquée et porte bien le nouveau contenu.
    const { rows } = await pool.query<{ content: string; total: string }>(
      `SELECT content, (SELECT COUNT(*) FROM lessons WHERE chapter_id = $2) AS total
       FROM lessons WHERE id = $1`,
      [lessonId, chapter.id],
    );
    expect(rows[0].content).toBe('Contenu réécrit par le formateur');
    expect(Number(rows[0].total)).toBe(chapter.lessons.length);

    // Nettoyage.
    await pool.query('DELETE FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [
      scope.userId, lessonId,
    ]);
    await provider.saveChapters(scope, [chapter]);
  });

  it('accepte un réordonnancement complet des chapitres d’une formation', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    const provider = getContentProvider();

    const courseId = (await provider.listCourses(scope))[0].id;
    const original = await provider.listChapters(scope, courseId);
    expect(original.length).toBeGreaterThan(1);

    // L'ordre inverse viole `UNIQUE (course_id, position)` si les positions ne
    // sont pas libérées avant d'être réassignées.
    const reversed = [...original].reverse().map((chapter, index) => ({ ...chapter, position: index }));
    await expect(provider.saveChapters(scope, reversed)).resolves.toBeUndefined();

    const after = await provider.listChapters(scope, courseId);
    expect(after.map((c) => c.id)).toEqual(reversed.map((c) => c.id));

    await provider.saveChapters(scope, original);
    const restored = await provider.listChapters(scope, courseId);
    expect(restored.map((c) => c.id)).toEqual(original.map((c) => c.id));
  });

  it('n’expose pas de formule propre à une autre organisation (catalogue global)', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const plans = await getContentProvider().listPlans(scope);
    expect(plans.length).toBeGreaterThanOrEqual(2);
    expect(plans.map((p) => p.id)).toEqual(expect.arrayContaining(['free', 'premium']));
  });
});

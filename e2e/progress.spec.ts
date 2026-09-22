import { test, expect } from '@playwright/test';
import { Pool } from 'pg';

/**
 * Progression de bout en bout (T5.1/T5.2/T5.3, REQ-PROG-01/02).
 *
 * ⚠️ La régression de la phase 4 était : **la progression n'était plus
 * persistée**. Le test qui compte est donc celui qui **rouvre une session** et
 * vérifie que la progression est toujours là. Un test qui se contente de relire
 * dans la même session ne prouverait rien — c'est exactement ce que faisait le
 * stockage en mémoire.
 *
 * ⚠️ **Une inscription libre-service crée une organisation VIDE** (REQ-ORG-04).
 * Le contenu seedé appartient à l'organisation `katalyst` : un nouvel inscrit
 * n'y a donc légitimement pas accès, et progresser dessus est refusé (403).
 * Les tests placent l'apprenant dans l'organisation seedée, comme le ferait une
 * invitation.
 */

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/katalyst';

const pool = new Pool({ connectionString: DATABASE_URL });

const RUN = Date.now().toString(36);
const PASSWORD = 'un-mot-de-passe-e2e-2026';

function cookieHeader(response: { headersArray(): { name: string; value: string }[] }): string {
  return response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .map((header) => header.value.split(';')[0])
    .join('; ');
}

/** Crée un compte et le place dans l'organisation qui porte le contenu seedé. */
async function learner(
  request: import('@playwright/test').APIRequestContext,
  local: string,
): Promise<{ email: string; cookie: string }> {
  const email = `${local}-${RUN}@e2e.local`;

  const registered = await request.post('/api/auth/register', {
    data: { email, password: PASSWORD, name: `Apprenant ${local}` },
  });
  expect(registered.status(), `inscription de ${local}`).toBe(201);
  const created = await registered.json();

  const seeded = await pool.query<{ id: string }>(
    'SELECT id FROM organizations ORDER BY created_at LIMIT 1',
  );
  await pool.query('UPDATE users SET organization_id = $2 WHERE id = $1', [
    created.user.id,
    seeded.rows[0].id,
  ]);

  // Reconnexion : le jeton doit porter la bonne organisation.
  const loggedIn = await request.post('/api/auth/login', { data: { email, password: PASSWORD } });
  expect(loggedIn.status(), `connexion de ${local}`).toBe(200);

  return { email, cookie: cookieHeader(loggedIn) };
}

/** Récupère une formation seedée et ses premières leçons. */
async function firstCourseWithLessons(request: import('@playwright/test').APIRequestContext) {
  const response = await request.get('/api/tutorials');
  const tutorials = (await response.json()) as {
    id: string;
    courseId: string;
    lessons: { id: string }[];
  }[];

  const withLessons = tutorials.find((tutorial) => tutorial.lessons?.length > 0);
  if (!withLessons) throw new Error('Aucun chapitre avec leçon dans le jeu de données.');

  return {
    courseId: withLessons.courseId,
    chapterId: withLessons.id,
    lessonIds: withLessons.lessons.slice(0, 3).map((lesson) => lesson.id),
  };
}

test.describe('API de progression', () => {
  test('exige une session', async ({ request }) => {
    expect((await request.get('/api/v1/progress')).status()).toBe(401);
    expect((await request.post('/api/v1/progress', { data: {} })).status()).toBe(401);
  });

  test('retourne une progression vide pour un nouvel apprenant', async ({ request }) => {
    const apprenant = await learner(request, 'vide');

    const response = await request.get('/api/v1/progress', {
      headers: { cookie: apprenant.cookie },
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).progress).toEqual({});
  });

  test('refuse des données invalides', async ({ request }) => {
    const apprenant = await learner(request, 'invalide');

    const response = await request.post('/api/v1/progress', {
      headers: { cookie: apprenant.cookie },
      data: { courseId: '', completedLessons: 'pas-un-tableau' },
    });

    expect(response.status()).toBe(400);
  });

  test('refuse une formation d’une autre organisation', async ({ request }) => {
    // Un inscrit NON déplacé : il reste dans sa propre organisation, vide.
    const registered = await request.post('/api/auth/register', {
      data: { email: `hors-org-${RUN}@e2e.local`, password: PASSWORD, name: 'Hors Org' },
    });
    const course = await firstCourseWithLessons(request);

    const response = await request.post('/api/v1/progress', {
      headers: { cookie: cookieHeader(registered) },
      data: { courseId: course.courseId, completedLessons: [] },
    });

    // Authentifié, mais le contenu appartient à une autre organisation : refus,
    // pas erreur serveur.
    expect(response.status()).toBe(403);
  });

  test('PERSISTE la progression au-delà de la session', async ({ request }) => {
    const apprenant = await learner(request, 'persiste');
    const course = await firstCourseWithLessons(request);

    // 1. L'apprenant termine deux leçons et s'arrête à un endroit précis.
    const saved = await request.post('/api/v1/progress', {
      headers: { cookie: apprenant.cookie },
      data: {
        courseId: course.courseId,
        completedLessons: course.lessonIds.slice(0, 2),
        quizScores: { [course.chapterId]: 80 },
        quizAttempts: { [course.chapterId]: 1 },
        quizAnswers: {},
        currentChapterId: course.chapterId,
        currentLessonId: course.lessonIds[2],
        currentView: 'lesson',
      },
    });
    expect(saved.status()).toBe(200);

    // 2. NOUVELLE session : c'est le cœur du test. Un stockage en mémoire aurait
    //    tout perdu ici.
    const loggedIn = await request.post('/api/auth/login', {
      data: { email: apprenant.email, password: PASSWORD },
    });
    expect(loggedIn.status()).toBe(200);

    const reloaded = await request.get('/api/v1/progress', {
      headers: { cookie: cookieHeader(loggedIn) },
    });

    const progress = (await reloaded.json()).progress[course.courseId];

    expect(progress).toBeTruthy();
    expect([...progress.completedLessons].sort()).toEqual(course.lessonIds.slice(0, 2).sort());
    expect(progress.quizScores[course.chapterId]).toBe(80);
  });

  test('conserve le point de reprise (REQ-PROG-02)', async ({ request }) => {
    const apprenant = await learner(request, 'reprise');
    const course = await firstCourseWithLessons(request);

    await request.post('/api/v1/progress', {
      headers: { cookie: apprenant.cookie },
      data: {
        courseId: course.courseId,
        completedLessons: [],
        currentChapterId: course.chapterId,
        currentLessonId: course.lessonIds[2],
        currentView: 'quiz',
      },
    });

    // Nouvelle session, comme une reconnexion le lendemain.
    const loggedIn = await request.post('/api/auth/login', {
      data: { email: apprenant.email, password: PASSWORD },
    });
    const reloaded = await request.get('/api/v1/progress', {
      headers: { cookie: cookieHeader(loggedIn) },
    });

    const progress = (await reloaded.json()).progress[course.courseId];

    expect(progress.currentChapterId).toBe(course.chapterId);
    expect(progress.currentLessonId).toBe(course.lessonIds[2]);
    expect(progress.currentView).toBe('quiz');
  });

  test('RETIRE une leçon décochée, y compris après reconnexion', async ({ request }) => {
    const apprenant = await learner(request, 'decoche');
    const course = await firstCourseWithLessons(request);

    await request.post('/api/v1/progress', {
      headers: { cookie: apprenant.cookie },
      data: { courseId: course.courseId, completedLessons: course.lessonIds.slice(0, 2) },
    });

    // L'apprenant décoche la seconde leçon.
    await request.post('/api/v1/progress', {
      headers: { cookie: apprenant.cookie },
      data: { courseId: course.courseId, completedLessons: course.lessonIds.slice(0, 1) },
    });

    const loggedIn = await request.post('/api/auth/login', {
      data: { email: apprenant.email, password: PASSWORD },
    });
    const reloaded = await request.get('/api/v1/progress', {
      headers: { cookie: cookieHeader(loggedIn) },
    });

    const progress = (await reloaded.json()).progress[course.courseId];

    // Sans le retrait côté serveur, la leçon resterait comptée comme terminée et
    // l'affichage mentirait.
    expect(progress.completedLessons).toEqual([course.lessonIds[0]]);
  });

  test('isole la progression entre deux apprenants', async ({ request }) => {
    const course = await firstCourseWithLessons(request);

    const premier = await learner(request, 'iso-a');
    const second = await learner(request, 'iso-b');

    await request.post('/api/v1/progress', {
      headers: { cookie: premier.cookie },
      data: { courseId: course.courseId, completedLessons: course.lessonIds.slice(0, 2) },
    });

    const pourB = await request.get('/api/v1/progress', {
      headers: { cookie: second.cookie },
    });

    // La progression est nominative : B ne voit rien de A.
    expect((await pourB.json()).progress).toEqual({});
  });
});

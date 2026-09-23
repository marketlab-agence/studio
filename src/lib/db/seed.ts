import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import type { PoolClient } from 'pg';
import { getPool, closePool } from './pool';
import { contentDomainFor } from '@/lib/content/course-domain';

// Un script autonome ne bénéficie pas du chargement automatique de Next.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

if (process.argv.includes('--test')) {
  if (!process.env.TEST_DATABASE_URL) {
    console.error('✖ --test demandé mais TEST_DATABASE_URL est absent.');
    process.exit(1);
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}


/**
 * Rejoue les données JSON (`src/data/`) dans PostgreSQL.
 *
 * CONTEXTE — les sources sont à **2 niveaux** (formation → chapitre → leçon),
 * le modèle cible en a **3** (+ semaine). L'ETL insère donc une **semaine par
 * défaut (S1)** par formation et y rattache ses chapitres, numérotés
 * `S.1.J.n` (n = 1 → 5, lundi à vendredi).
 *
 * Idempotent : `ON CONFLICT ... DO UPDATE` partout — rejouer ne duplique rien.
 *
 * Usage : npm run db:seed  |  npm run db:seed:test
 */

const DATA_DIR = join(process.cwd(), 'src', 'data');

const DEFAULT_ORGANIZATION = {
  name: 'Katalyst',
  slug: 'katalyst',
  brandName: 'Katalyst',
  accentColor: '#1e3a8a',
  planId: 'premium',
};

/** Points attribués par défaut à une leçon (aligné sur la référence REWORK). */
const DEFAULT_LESSON_POINTS = 20;

type JsonRecord = Record<string, unknown>;

function readJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8')) as T;
}

interface SourceCourse {
  id: string;
  title: string;
  description?: string;
  status?: string;
  plan?: unknown;
  generationParams?: unknown;
}

interface SourceLesson {
  id: string;
  title: string;
  objective?: string;
  content?: string;
  interactiveComponentName?: string;
  visualComponentName?: string;
  /**
   * Niveau de Bloom visé par l'objectif.
   *
   * ⚠️ **Optionnel, et c'est délibéré** : absent vaut « à compléter » (méthode REWORK). Un
   * JSON sans ce champ ne casse pas le seed et n'efface pas la valeur stockée en base.
   */
  bloomLevel?: string;
}

interface SourceTutorial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  lessons?: SourceLesson[];
}

interface SourceQuiz {
  id: string;
  title: string;
  passingScore?: number;
  feedbackTiming?: 'immediate' | 'end';
  questions?: Array<{
    id: string;
    text: string;
    isMultipleChoice?: boolean;
    answers?: Array<{ id: string; text: string; isCorrect?: boolean }>;
  }>;
}

interface SourcePlan {
  id: string;
  name: string;
  description?: string;
  price?: number;
  billingPeriod?: string;
  features?: string[];
  courses?: string[];
  cta?: string;
  recommended?: boolean;
}

interface SourceUser {
  id: string;
  name: string;
  email: string;
  planId?: string;
  status?: string;
  role?: string;
  joined?: string;
  phone?: string;
}

/**
 * Déduit le type de leçon à partir des données sources.
 * Les sources ne portent pas de type : on le dérive de la présence d'un
 * composant interactif (pratique) ou visuel (capsule illustrée).
 */
function inferLessonType(lesson: SourceLesson): string {
  if (lesson.interactiveComponentName) return 'MISE_EN_PRATIQUE';
  if (lesson.visualComponentName) return 'CAPSULE';
  return 'TEXTE';
}

async function ensureOrganization(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO organizations (name, slug, brand_name, accent_color, plan_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [
      DEFAULT_ORGANIZATION.name,
      DEFAULT_ORGANIZATION.slug,
      DEFAULT_ORGANIZATION.brandName,
      DEFAULT_ORGANIZATION.accentColor,
      DEFAULT_ORGANIZATION.planId,
    ],
  );
  return rows[0].id;
}

async function seedPlans(client: PoolClient): Promise<void> {
  const plans = readJson<SourcePlan[]>('plans.json');

  for (const [index, plan] of plans.entries()) {
    await client.query(
      `INSERT INTO plans (id, name, description, price, billing_period, features, courses, cta, recommended, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
         billing_period = EXCLUDED.billing_period, features = EXCLUDED.features,
         courses = EXCLUDED.courses, cta = EXCLUDED.cta,
         recommended = EXCLUDED.recommended, position = EXCLUDED.position`,
      [
        plan.id, plan.name, plan.description ?? null, plan.price ?? 0,
        plan.billingPeriod ?? 'monthly', JSON.stringify(plan.features ?? []),
        JSON.stringify(plan.courses ?? []), plan.cta ?? null,
        plan.recommended ?? false, index,
      ],
    );
  }
}

async function seedContent(client: PoolClient, organizationId: string): Promise<void> {
  const courses = readJson<SourceCourse[]>('courses.json');
  const tutorials = readJson<SourceTutorial[]>('tutorials.json');
  const quizzes = readJson<Record<string, SourceQuiz>>('quizzes.json');

      for (const course of courses) {
        await client.query(
    `INSERT INTO courses (id, organization_id, title, description, status, plan, generation_params, content_domain)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title, description = EXCLUDED.description,
             status = EXCLUDED.status, plan = EXCLUDED.plan,
             generation_params = EXCLUDED.generation_params,
             content_domain = EXCLUDED.content_domain`,
          [
            course.id, organizationId, course.title, course.description ?? '',
            course.status ?? 'Brouillon',
            course.plan ? JSON.stringify(course.plan) : null,
            course.generationParams ? JSON.stringify(course.generationParams) : null,
            // Le domaine est **déduit de l'identifiant source**, qui est un slug explicite
            // (« git-github-tutorial », « le-closing… ») : c'est plus fiable qu'une analyse
            // du titre, et cela évite de maintenir une table de correspondance à la main.
            (contentDomainFor(course.id) ?? undefined),
          ],
        );

    const courseChapters = tutorials.filter((tutorial) => tutorial.courseId === course.id);

    // AUCUN regroupement n'est créé : les sources n'en contiennent pas, et
    // l'intitulé d'un regroupement est une décision du formateur. Les chapitres
    // sont donc rattachés directement à la formation (`week_id = NULL`).
    for (const [chapterIndex, tutorial] of courseChapters.entries()) {
      await client.query(
        `INSERT INTO chapters (id, course_id, week_id, title, position)
         VALUES ($1, $2, NULL, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           course_id = EXCLUDED.course_id, title = EXCLUDED.title,
           position = EXCLUDED.position`,
        [tutorial.id, course.id, tutorial.title, chapterIndex],
      );

      const lessons = tutorial.lessons ?? [];
      for (const [lessonIndex, lesson] of lessons.entries()) {
        const lessonId = `${tutorial.id}__${lessonIndex + 1}`;

        await client.query(
          `INSERT INTO lessons (
             id, chapter_id, source_id, title, objective, content, type,
             points, interactive_component_name, visual_component_name, position, bloom_level
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             source_id = EXCLUDED.source_id, title = EXCLUDED.title,
             objective = EXCLUDED.objective,
             content = EXCLUDED.content, type = EXCLUDED.type, points = EXCLUDED.points,
             interactive_component_name = EXCLUDED.interactive_component_name,
             visual_component_name = EXCLUDED.visual_component_name,
             position = EXCLUDED.position,
             -- COALESCE volontaire : un bloom_level absent du JSON ne doit PAS écraser
             -- un niveau déclaré en base. Re-seeder ne doit jamais détruire un travail de
             -- conformité (T6.8) : la donnée pédagogique saisie survit à la ré-initialisation.
             bloom_level = COALESCE(EXCLUDED.bloom_level, lessons.bloom_level)`,
          [
            lessonId, tutorial.id, lesson.id, lesson.title,
            lesson.objective ?? '', lesson.content ?? '',
            inferLessonType(lesson), DEFAULT_LESSON_POINTS,
            lesson.interactiveComponentName ?? null,
            lesson.visualComponentName ?? null,
            lessonIndex,
            lesson.bloomLevel ?? null,
          ],
        );
      }

      // Un quiz par chapitre : la clé de quizzes.json correspond à l'id du chapitre.
      const quiz = quizzes[tutorial.id];
      if (quiz) {
        await client.query(
          `INSERT INTO quizzes (id, chapter_id, title, passing_score, feedback_timing)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title, passing_score = EXCLUDED.passing_score,
             feedback_timing = EXCLUDED.feedback_timing`,
          [
            tutorial.id, tutorial.id, quiz.title ?? tutorial.title,
            quiz.passingScore ?? 80, quiz.feedbackTiming ?? 'end',
          ],
        );

        for (const [questionIndex, question] of (quiz.questions ?? []).entries()) {
          const questionId = `${tutorial.id}__q${questionIndex + 1}`;

          await client.query(
            `INSERT INTO questions (id, quiz_id, text, is_multiple_choice, position)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               text = EXCLUDED.text, is_multiple_choice = EXCLUDED.is_multiple_choice,
               position = EXCLUDED.position`,
            [questionId, tutorial.id, question.text, question.isMultipleChoice ?? false, questionIndex],
          );

          for (const [answerIndex, answer] of (question.answers ?? []).entries()) {
            await client.query(
              `INSERT INTO answers (id, question_id, text, is_correct, position)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (id) DO UPDATE SET
                 text = EXCLUDED.text, is_correct = EXCLUDED.is_correct,
                 position = EXCLUDED.position`,
              [`${questionId}__a${answerIndex + 1}`, questionId, answer.text, answer.isCorrect ?? false, answerIndex],
            );
          }
        }
      }
    }
  }
}

/**
 * Paramètres applicatifs de l'organisation (table `settings`, clé `app`).
 * Alignés sur `src/data/settings.json`.
 */
async function seedSettings(client: PoolClient, organizationId: string): Promise<void> {
  const settings = readJson<Record<string, unknown>>('settings.json');

  await client.query(
    `INSERT INTO settings (organization_id, key, value)
     VALUES ($1, 'app', $2)
     ON CONFLICT (organization_id, key) DO UPDATE SET
       value = EXCLUDED.value, updated_at = NOW()`,
    [organizationId, JSON.stringify(settings)],
  );
}

async function seedUsers(client: PoolClient, organizationId: string): Promise<number> {
  const users = readJson<SourceUser[]>('users.json');
  const allowedRoles = new Set(['Super Admin', 'Propriétaire', 'Admin', 'Modérateur', 'Utilisateur']);
  let imported = 0;

  for (const user of users) {
    if (!user.email) continue;

    const role = user.role && allowedRoles.has(user.role) ? user.role : 'Utilisateur';
    const status = user.status === 'Inactif' ? 'Inactif' : 'Actif';

    await client.query(
      `INSERT INTO users (
         organization_id, email, name, role, plan_id, status, phone,
         -- Les comptes repris de Firebase Auth n'ont pas de mot de passe local.
         must_reset_password
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name, role = EXCLUDED.role,
         plan_id = EXCLUDED.plan_id, status = EXCLUDED.status`,
      [
        organizationId, user.email, user.name, role,
        user.planId ?? 'free', status, user.phone ?? null,
      ],
    );
    imported += 1;
  }

  return imported;
}

async function run(): Promise<void> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    // Ordre imposé par les clés étrangères : plans avant organizations
    // (organizations.plan_id référence plans.id), puis le contenu, puis les comptes.
    await seedPlans(client);
    const organizationId = await ensureOrganization(client);
    await seedSettings(client, organizationId);
    await seedContent(client, organizationId);
    const userCount = await seedUsers(client, organizationId);

    await client.query('COMMIT');

    const { rows } = await client.query<{
      courses: string; weeks: string; chapters: string; lessons: string;
      quizzes: string; questions: string; answers: string; plans: string; users: string;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM courses)   AS courses,
        (SELECT COUNT(*) FROM weeks)     AS weeks,
        (SELECT COUNT(*) FROM chapters)  AS chapters,
        (SELECT COUNT(*) FROM lessons)   AS lessons,
        (SELECT COUNT(*) FROM quizzes)   AS quizzes,
        (SELECT COUNT(*) FROM questions) AS questions,
        (SELECT COUNT(*) FROM answers)   AS answers,
        (SELECT COUNT(*) FROM plans)     AS plans,
        (SELECT COUNT(*) FROM users)     AS users
    `);

    console.log('✔ Seed terminé');
    console.log(`  organizations : 1 (${DEFAULT_ORGANIZATION.slug})`);
    console.log(`  plans         : ${rows[0].plans}`);
    console.log(`  courses       : ${rows[0].courses}`);
    console.log(`  weeks         : ${rows[0].weeks}`);
    console.log(`  chapters      : ${rows[0].chapters}`);
    console.log(`  lessons       : ${rows[0].lessons}`);
    console.log(`  quizzes       : ${rows[0].quizzes}`);
    console.log(`  questions     : ${rows[0].questions}`);
    console.log(`  answers       : ${rows[0].answers}`);
    console.log(`  users         : ${rows[0].users} (${userCount} depuis users.json)`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

run().catch((error) => {
  console.error('✖ Échec du seed :', error);
  process.exit(1);
});

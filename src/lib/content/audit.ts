import { config as loadEnv } from 'dotenv';
import { closePool, query } from '@/lib/db/pool';
import {
  CourseSchema,
  auditCourseContent,
  type ContentComplianceReport,
  type CourseContent,
} from '@/lib/schemas/content';

/**
 * Audit de conformité du contenu — `npm run audit:content`
 *
 * ⚠️ **Rejouable à tout moment.** Une formation reste modifiable (ajout ou retrait de
 * chapitres et de leçons) : sa conformité doit donc pouvoir être **re-vérifiée après chaque
 * modification**, et non contrôlée une seule fois à la création.
 *
 * Fondement : `@docs/katalyst/regles-conformite.md` — les règles R2, R4, R5.1, R6 sont
 * évaluées ; R1 (analyse du besoin) et R5.3 (référent pédagogique) sont **déclarées non
 * évaluables** avec leur raison, plutôt que de conclure à tort.
 *
 * Usage :
 *   npm run audit:content            # rapport synthétique
 *   npm run audit:content -- --test  # sur la base de test
 *   npm run audit:content -- --detail # détail des constats
 */

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

if (process.argv.includes('--test')) {
  if (!process.env.TEST_DATABASE_URL) {
    console.error('⚠️  --test demandé mais TEST_DATABASE_URL est absent.');
    process.exit(1);
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

const DETAIL = process.argv.includes('--detail');

type CourseRow = {
  id: string;
  title: string;
}

type ChapterRow = {
  id: string;
  course_id: string;
  title: string;
  week_id: string | null;
  position: number;
  unlock_rule_id: string | null;
}

type LessonRow = {
  id: string;
  chapter_id: string;
  title: string;
  objective: string;
  content: string;
  type: string;
  points: number;
  position: number;
  interactive_component_name: string | null;
  visual_component_name: string | null;
}

type QuizRow = {
  id: string;
  chapter_id: string;
  title: string;
  passing_score: number;
  feedback_timing: string | null;
  questions: unknown;
}

/** Reconstruit un `CourseContent` depuis la base, pour l'auditer. */
async function loadCourses(): Promise<CourseContent[]> {
  const { rows: courses } = await query<CourseRow>(
    'SELECT id, title FROM courses ORDER BY created_at',
  );

  const { rows: chapters } = await query<ChapterRow>(
    'SELECT id, course_id, title, week_id, position, unlock_rule_id FROM chapters ORDER BY course_id, position',
  );

  const { rows: lessons } = await query<LessonRow>(
    `SELECT id, chapter_id, title, objective, content, type, points, position,
            interactive_component_name, visual_component_name
     FROM lessons ORDER BY chapter_id, position`,
  );

  const { rows: quizzes } = await query<QuizRow>(
    `SELECT q.id, q.chapter_id, q.title, q.passing_score, q.feedback_timing,
            COALESCE(json_agg(json_build_object(
              'id', qu.id, 'text', qu.text, 'isMultipleChoice', qu.is_multiple_choice,
              'answers', COALESCE((SELECT json_agg(json_build_object(
                'id', a.id, 'text', a.text, 'isCorrect', a.is_correct) ORDER BY a.position)
                FROM answers a WHERE a.question_id = qu.id), '[]'::json)
            ) ORDER BY qu.position) FILTER (WHERE qu.id IS NOT NULL), '[]'::json) AS questions
     FROM quizzes q
     LEFT JOIN questions qu ON qu.quiz_id = q.id
     GROUP BY q.id, q.chapter_id, q.title, q.passing_score, q.feedback_timing`,
  );

  const lessonsByChapter = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const list = lessonsByChapter.get(lesson.chapter_id) ?? [];
    list.push(lesson);
    lessonsByChapter.set(lesson.chapter_id, list);
  }

  const quizByChapter = new Map(quizzes.map((quiz) => [quiz.chapter_id, quiz]));

  return courses.map((course) => {
    const courseChapters = chapters.filter((chapter) => chapter.course_id === course.id);

    return {
      id: course.id,
      title: course.title,
      description: '',
      status: 'Publié' as const,
      weeks: [],
      chapters: courseChapters.map((chapter) => {
        const quiz = quizByChapter.get(chapter.id);

        return {
          id: chapter.id,
          title: chapter.title,
          description: '',
          // ⚠️ La base renvoie `null` pour une colonne vide, alors que le schéma Zod attend
          // `undefined` (champ **facultatif**). Convertir explicitement : sans cela, toute
          // formation est déclarée « invalide » et l'audit ne peut rien mesurer.
          weekId: chapter.week_id ?? undefined,
          position: chapter.position,
          unlockRuleId: chapter.unlock_rule_id ?? undefined,
          lessons: (lessonsByChapter.get(chapter.id) ?? []).map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            objective: lesson.objective,
            content: lesson.content,
            type: lesson.type as CourseContent['chapters'][number]['lessons'][number]['type'],
            points: lesson.points,
            position: lesson.position,
            interactiveComponentName: lesson.interactive_component_name ?? undefined,
            visualComponentName: lesson.visual_component_name ?? undefined,
          })),
          quiz: quiz
            ? {
                id: quiz.id,
                title: quiz.title,
                passingScore: quiz.passing_score,
                feedbackTiming: (quiz.feedback_timing ?? 'end') as 'immediate' | 'end',
                questions: (quiz.questions ?? []) as NonNullable<
                  CourseContent['chapters'][number]['quiz']
                >['questions'],
              }
            : undefined,
        };
      }),
    } as CourseContent;
  });
}

/** Affiche le rapport d'une formation. */
function report(course: CourseContent, audit: ContentComplianceReport): void {
  const status = audit.compliant ? '✅ CONFORME' : '❌ NON CONFORME';
  console.log('');
  console.log(`  ${status}  ${course.title}`);
  console.log(
    `    ${audit.totalLessons} leçons · ${audit.interactiveLessons} interactives · ` +
      `${audit.visualLessons} visuelles · ${audit.quizzes} quiz`,
  );

  for (const rule of audit.rules) {
    const count = rule.findings.length;
    const mark = !rule.evaluable ? '⏳' : count === 0 ? '  ✓' : '  ✗';

    // ⚠️ Les deux motifs de non-évaluation ne veulent pas dire la même chose :
    // - un arrêté non publié ne dépend pas de nous ;
    // - des données à compléter sont un **travail à faire**.
    const suffix = !rule.evaluable
      ? rule.notEvaluableReason === 'donnees-a-completer'
        ? `  (à compléter : ${count} leçon(s) sans niveau)`
        : '  (non évaluable — seuil en attente d’arrêté)'
      : count === 0
        ? ''
        : `  ${count} constat(s)`;

    console.log(`  ${mark} ${rule.rule.padEnd(5)} ind. ${String(rule.indicator).padStart(2)} · ${rule.label}${suffix}`);

    if (DETAIL && count > 0) {
      for (const finding of rule.findings.slice(0, 10)) {
        console.log(`        - ${finding}`);
      }
      if (count > 10) console.log(`        … et ${count - 10} autre(s)`);
    }
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('  Audit de conformité du contenu');
  console.log('  Règles : @docs/katalyst/regles-conformite.md');
  if (!DETAIL) console.log('  (ajouter --detail pour le détail des constats)');

  const courses = await loadCourses();

  if (courses.length === 0) {
    console.log('');
    console.log('  Aucune formation en base. Exécuter `npm run db:seed`.');
    return;
  }

  let compliantCount = 0;

  for (const course of courses) {
    // Validation Zod d'abord : un contenu qui ne respecte pas son propre schéma ne peut pas
    // être audité honnêtement.
    const parsed = CourseSchema.safeParse(course);
    if (!parsed.success) {
      console.log('');
      console.log(`  ⚠️  ${course.title} — contenu invalide, audit impossible :`);
      for (const issue of parsed.error.issues.slice(0, 3)) {
        console.log(`        ${issue.path.join('.')} : ${issue.message}`);
      }
      continue;
    }

    const audit = auditCourseContent(parsed.data);
    report(parsed.data, audit);
    if (audit.compliant) compliantCount++;
  }

  console.log('');
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  Bilan : ${compliantCount}/${courses.length} formation(s) conforme(s)`);
  console.log('');

  // ⚠️ Le script **ne sort pas en erreur** : l'audit est un instrument de mesure. Un échec
  // bloquant ferait échouer la CI pour un écart connu et attendu (les 80 leçons seedées
  // précèdent les règles), et masquerait les vrais résultats.
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('Échec de l’audit :', error instanceof Error ? error.message : error);
    await closePool();
    process.exit(1);
  });

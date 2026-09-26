'use server';

import { revalidatePath } from 'next/cache';
import { type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { getCourses, saveCourses, deleteCourse } from '@/lib/courses';
import { getTutorials, saveTutorials } from '@/lib/tutorials';
import { getQuizzes, saveQuizzes } from '@/lib/quiz';
import type { Tutorial, Lesson, Quiz, Question, GenerateLessonContentOutput } from '@/types/tutorial.types';
import type { CourseInfo } from '@/types/course.types';
import { generateLessonContent, type GenerateLessonContentInput } from '@/ai/flows/generate-lesson-content-flow';
// Métadonnées seules : éviter de tirer les 46 composants (et Genkit via AiHelper)
// dans une action serveur qui n'a besoin que des noms et descriptions.
import {
  listNamesForDomain,
  listFunctionalInteractiveNamesForDomain,
  listByBloomLevel,
  type ComponentDomain,
} from '@/components/registry/catalog';
import { BLOOM_LEVELS, type BloomLevel } from '@/lib/content/bloom';

const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

  export async function savePlanAction(plan: CreateCourseOutput, params: CreateCourseInput): Promise<{ courseId: string }> {
      const courses = await getCourses();
      
      const courseId = slugify(plan.title);
      
      const courseIndex = courses.findIndex(c => c.id === courseId);

      /**
       * La langue du contenu vient du formulaire de génération (`courseLanguage`),
       * que le créateur a déjà renseigné pour que l'IA rédige dans la bonne langue.
       *
       * ⚠️ **On ne redemande pas la langue ici.** Elle est connue au moment de la
       * génération ; la reposer au moment de l'enregistrement créerait deux sources
       * qui pourraient diverger. Le repli `'fr'` couvre l'appel sans formulaire.
       */
      const langueDemandee = params.courseLanguage;
      const language: CourseInfo['language'] =
          langueDemandee === 'en' || langueDemandee === 'es' ? langueDemandee : 'fr';

      const newCourseData: CourseInfo = {
          id: courseId,
          title: plan.title,
          description: plan.description,
          status: 'Plan',
          plan: plan,
          generationParams: params,
          language,
      };

    if (courseIndex !== -1) {
        courses[courseIndex] = { ...courses[courseIndex], ...newCourseData };
    } else {
        courses.push(newCourseData);
    }

    await saveCourses(courses);
    revalidatePath('/admin/courses');
    return { courseId };
}


export async function buildCourseFromPlanAction(courseId: string) {
    // 1. Récupérer les données à jour
    const courses = await getCourses();
    const course = courses.find(c => c.id === courseId);

    if (!course || !course.plan) {
        throw new Error("Course or its plan not found.");
    }

    const plan = course.plan;
    
    // 2. Récupérer les chapitres (« tutorials ») et quiz existants
    let tutorials = await getTutorials();
    let quizzes = await getQuizzes();

    // 3. Construire la structure à partir du plan
    plan.chapters.forEach((chapterPlan, chapterIndex) => {
        const chapterId = `${courseId}-ch${chapterIndex + 1}`;
        
        // Skip if chapter (tutorial) already exists to avoid duplication
        if (tutorials.find(t => t.id === chapterId)) return;

          const lessons: Lesson[] = chapterPlan.lessons.map((lessonPlan, lessonIndex) => ({
              id: `${chapterId}-l${lessonIndex + 1}`,
              title: lessonPlan.title,
              objective: lessonPlan.objective,
              content: `Contenu en attente de génération pour "${lessonPlan.title}"...`,
              // Aucun composant à la création : ils seront choisis à la génération
              // du contenu de la leçon, selon son niveau de Bloom.
              components: [],
          }));

        const newTutorial: Tutorial = {
            id: chapterId,
            courseId: courseId,
            title: chapterPlan.title,
            description: `Un chapitre sur ${chapterPlan.title}.`,
            lessons: lessons,
        };
        tutorials.push(newTutorial);

        // Skip if quiz already exists
        if (quizzes[chapterId]) return;

        const quizQuestions: Question[] = chapterPlan.quiz.questions.map((q, questionIndex) => ({
            id: `${chapterId}-q${questionIndex + 1}`,
            text: q.text,
            answers: q.answers.map((a, answerIndex) => ({
                id: `${chapterId}-q${questionIndex + 1}-a${answerIndex + 1}`,
                text: a.text,
                isCorrect: !!a.isCorrect,
            })),
            isMultipleChoice: !!q.isMultipleChoice,
        }));

        const newQuiz: Quiz = {
            id: chapterId,
            title: chapterPlan.quiz.title,
            questions: quizQuestions,
            passingScore: 80,
            feedbackTiming: chapterPlan.quiz.feedbackTiming || 'end',
        };
        quizzes[chapterId] = newQuiz;
    });

    const courseIndexToUpdate = courses.findIndex(c => c.id === courseId);
    if(courseIndexToUpdate !== -1) {
        courses[courseIndexToUpdate] = {
            ...course,
            status: 'Brouillon',
        };
    }
    
    await saveCourses(courses);
    await saveTutorials(tutorials);
    await saveQuizzes(quizzes);

    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
}


export async function publishCourseAction(courseId: string) {
    const courses = await getCourses();
    const course = courses.find(c => c.id === courseId);
    if (course) {
        course.status = 'Publié';
        await saveCourses(courses);
        revalidatePath('/admin');
        revalidatePath('/admin/courses');
        revalidatePath(`/admin/courses/${courseId}`);
    }
}

export async function getCourseAndChaptersAction(courseId: string): Promise<{ course: CourseInfo | undefined, chapters: Tutorial[] }> {
    const courses = await getCourses();
    const tutorials = await getTutorials();
    const course = courses.find(c => c.id === courseId);
    const chapters = tutorials.filter(t => t.courseId === courseId);
    return { course, chapters };
}

export async function updateLessonContentAction(courseId: string, chapterId: string, updatedLesson: Lesson) {
    const tutorials = await getTutorials();
    const chapterIndex = tutorials.findIndex(t => t.id === chapterId);
    if (chapterIndex === -1) {
        throw new Error('Chapter not found');
    }
    const lessonIndex = tutorials[chapterIndex].lessons.findIndex(l => l.id === updatedLesson.id);
    if (lessonIndex === -1) {
        throw new Error('Lesson not found');
    }
    tutorials[chapterIndex].lessons[lessonIndex] = updatedLesson;
    await saveTutorials(tutorials);

    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${updatedLesson.id}`);
}


/**
 * Domaine d'une formation : **champ explicite**, avec repli heuristique.
 *
 * ⚠️ **Pourquoi le champ prime sur l'heuristique.** Une déduction par mots-clés se trompe
 * sur les cas mixtes : « Git pour les commerciaux » contient « git » *et* « commercial » —
 * elle serait classée Git, privant l'IA des composants commerciaux. Le champ
 * `courses.content_domain` (migration 010) permet à l'auteur de **trancher lui-même**.
 *
 * L'heuristique ne subsiste que pour les formations créées **avant** la migration, dont le
 * domaine est `NULL`. Elle disparaîtra quand elles seront complétées.
 */
function resolveCourseDomain(course: CourseInfo & { contentDomain?: string | null }): ComponentDomain | undefined {
  // 1. Le choix explicite de l'auteur fait foi.
  if (course.contentDomain) return course.contentDomain as ComponentDomain;

  // 2. Repli : déduction depuis le titre et la description (formations antérieures).
  return inferDomain(course);
}

/**
 * Déduit le domaine d'une formation depuis son titre et sa description.
 *
 * ⚠️ **Heuristique de repli, assumée et provisoire.** Elle ne sert que pour les formations
 * dont `content_domain` est `NULL` — c'est-à-dire créées avant la migration 010. Elle
 * évite le pire (proposer des simulateurs Git à une formation de vente) sans imposer une
 * migration de données.
 *
 * Retourne `undefined` si rien ne correspond : dans ce cas, aucun filtrage n'est appliqué —
 * mieux vaut proposer trop que priver l'IA de tout composant.
 */
function inferDomain(course: CourseInfo): ComponentDomain | undefined {
  const haystack = `${course.title} ${course.description}`.toLowerCase();

  const patterns: [ComponentDomain, RegExp][] = [
    ['git', /\bgit\b|github|versionn|branche|commit/],
    ['ia', /\bia\b|intelligence artificielle|prompt|llm|chatgpt|gemini/],
    ['automatisation', /n8n|automatis|workflow|zapier|make\b/],
    ['gestion-projet', /jira|agile|scrum|kanban|gestion de projet|sprint/],
    ['marketing', /marketing|seo|audience|réseaux sociaux|publicité|contenu/],
    ['vente', /vente|closing|prospect|commercial|négociation|objection/],
  ];

  for (const [domain, pattern] of patterns) {
    if (pattern.test(haystack)) return domain;
  }

  return undefined;
}

/**
 * Retient un niveau de Bloom **valide**, ou `undefined`.
 *
 * `Lesson.bloomLevel` est un `string` en base : le cast direct vers `BloomLevel` mentirait sur
 * une donnée corrompue. On valide donc à l'exécution avant de filtrer le catalogue.
 */
function resolveBloomLevel(value?: string): BloomLevel | undefined {
  return value && (BLOOM_LEVELS as readonly string[]).includes(value)
    ? (value as BloomLevel)
    : undefined;
}

/**
 * Composants proposés à l'IA, issus du **registre unique** (`src/components/registry/catalog.ts`).
 *
 * Trois filtres, tous nécessaires :
 *
 * 1. **Placeholders exclus** — un composant dont l'interface existe sans interaction ne doit
 *    pas servir de « mise en pratique » : l'IA générerait des leçons pointant vers des coquilles.
 * 2. **Domaine filtré** (2026-09-23) — sans ce filtre, l'IA recevait le catalogue **entier** :
 *    sur une formation de vente, elle se voyait proposer `MergeSimulator`.
 * 3. **Niveau de Bloom** (2026-09-23) — les interactifs sont restreints à ceux qui couvrent le
 *    niveau visé. C'est un filtrage **par construction** : l'IA ne peut pas choisir hors niveau,
 *    au lieu d'être censée s'y tenir.
 *
 * ⚠️ **Seuls les INTERACTIFS sont filtrés par Bloom.** Les visuels sont illustratifs, sans
 * obligation de niveau : les filtrer les écarterait à tort de leçons pourtant éligibles.
 *
 * ⚠️ Domaine et niveau sont **optionnels** : sans eux, on ne filtre pas. Mieux vaut proposer
 * trop que priver l'IA de tout composant faute d'information.
 */
function getRelevantComponents(
  domain: ComponentDomain | undefined,
  bloomLevel: BloomLevel | undefined,
): { interactive: string[]; visual: string[] } {
  const interactifs = bloomLevel
    ? listByBloomLevel('interactive', bloomLevel, domain)
        .filter((meta) => meta.status === 'functional')
        .map((meta) => meta.name)
    : listFunctionalInteractiveNamesForDomain(domain);

  return {
    interactive: interactifs,
    visual: listNamesForDomain('visual', domain),
  };
}


export async function generateLessonContentAction(
  courseId: string,
  chapterIndex: number,
  lessonIndex: number
): Promise<GenerateLessonContentOutput> {
  try {
    const courses = await getCourses();
    const tutorials = await getTutorials();

    const course = courses.find((c) => c.id === courseId);
    if (!course || !course.plan) {
      throw new Error('Course or course plan not found.');
    }

    const generationParams = course.generationParams;

    const chapterPlan = course.plan.chapters[chapterIndex];
    const lessonPlan = chapterPlan?.lessons[lessonIndex];

    const chapterId = `${courseId}-ch${chapterIndex + 1}`;
    const lessonId = `${chapterId}-l${lessonIndex + 1}`;

    const tutorialChapterIndex = tutorials.findIndex((t) => t.id === chapterId);
    const tutorialLessonIndex = tutorials[tutorialChapterIndex]?.lessons.findIndex((l) => l.id === lessonId);

    if (!lessonPlan || tutorialChapterIndex === -1 || typeof tutorialLessonIndex === 'undefined' || tutorialLessonIndex === -1) {
      throw new Error('Lesson plan or tutorial lesson structure not found.');
    }

    const contextLines = [
      'Contexte du cours:',
      '',
      `${course.title}`,
      `Description: ${course.plan.description}`,
      '',
      'Plan complet des chapitres:',
      ...course.plan.chapters.map((c) => `- ${c.title}`),
      '',
      'Leçons de ce chapitre:',
      ...chapterPlan.lessons.map((l) => `- ${l.title}: ${l.objective}`),
    ];

    const chapterContext = contextLines.join('\n');

    // Le domaine est déduit des paramètres de génération de la formation.
  //
  // ⚠️ **Point ouvert** : il repose sur une heuristique par mots-clés, en attendant que le
  // domaine soit un **champ explicite** de la formation (à ajouter avec `organization.type`,
  // étape 12 du plan de phase 6). En l'absence de correspondance, `undefined` — donc pas de
  // filtrage, ce qui conserve le comportement antérieur.
  const domain = resolveCourseDomain(course);

  // La leçon en base porte déjà son niveau de Bloom (complété par l'auteur ou l'alignement).
  const leconCible = tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex];
  const bloomLevel = resolveBloomLevel(leconCible.bloomLevel);

  const { interactive: relevantInteractive, visual: relevantVisual } = getRelevantComponents(
    domain,
    bloomLevel,
  );

    const input: GenerateLessonContentInput = {
      lessonTitle: lessonPlan.title,
      lessonObjective: lessonPlan.objective,
      courseTopic: course.title,
      targetAudience: generationParams?.targetAudience || 'Débutants',
      courseLanguage: generationParams?.courseLanguage || 'Français',
      lessonLength: generationParams?.lessonLength || 'Moyen',
      chapterContext,
      bloomLevel,
      availableInteractiveComponents: relevantInteractive,
      availableVisualComponents: relevantVisual,
    };

      const result = await generateLessonContent(input);
      const { illustrativeContent, components } = result;

      leconCible.content = illustrativeContent;

      /**
       * ⚠️ **L'ordre vient de l'IA, les positions de l'index.** Le flux reçoit une liste
       * déjà ordonnée (pratique puis illustration, s'il y a lieu) ; on la persiste telle
       * quelle. La liste peut être **vide** : une leçon notionnelle n'a pas forcément
       * d'exercice, et le plancher de composants n'est **pas bloquant**.
       *
       * ⚠️ **La `config` de chaque composant est préservée** : c'est elle qui porte les
       * libellés (dans la langue de la formation) et les données de l'instance.
       */
      leconCible.components = components.map((composant, index) => ({
        name: composant.name,
        position: index,
        config: composant.config ?? {},
      }));

      await saveTutorials(tutorials);

    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
    
    return result;
  } catch (error) {
    console.error(`[generateLessonContentAction] Failed for courseId: ${courseId}`, error);
    throw new Error('Failed to generate lesson content.');
  }
}


export async function updateQuizAction(courseId: string, chapterId: string, updatedQuiz: Quiz) {
    const quizzes = await getQuizzes();
    if (!quizzes[chapterId]) {
        throw new Error('Quiz not found');
    }
    quizzes[chapterId] = updatedQuiz;
    await saveQuizzes(quizzes);

    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/quiz`);
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
}

export async function deleteCourseAction(courseId: string) {
    try {
        // La cascade en base remplace l'ancienne transaction Firestore, qui
        // nettoyait manuellement chapitres, leçons, quiz et progression.
        // Sont supprimés par `ON DELETE CASCADE` : chapters, lessons, quizzes,
        // questions, answers, user_lesson_progress et user_course_progress.
        await deleteCourse(courseId);

        revalidatePath('/admin/courses');
        revalidatePath('/dashboard');
    } catch (error) {
        console.error(`Failed to delete course ${courseId}: `, error);
        throw new Error("Failed to delete course and associated data.");
    }
}

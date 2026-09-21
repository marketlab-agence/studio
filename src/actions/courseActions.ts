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
import { listNames, listFunctionalInteractiveNames } from '@/components/registry/catalog';

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

    const newCourseData: CourseInfo = {
        id: courseId,
        title: plan.title,
        description: plan.description,
        status: 'Plan',
        plan: plan,
        generationParams: params,
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
            interactiveComponentName: undefined,
            visualComponentName: undefined,
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
 * Composants proposés à l'IA, issus du **registre unique** (`src/components/registry.ts`).
 *
 * Seuls les composants interactifs **réellement opérationnels** sont proposés
 * comme « mise en pratique » : les 13 placeholders (interface sans interaction)
 * en sont exclus, sinon l'IA générerait des leçons pointant vers des coquilles.
 *
 * Auparavant, cette fonction maintenait deux listes en dur, désynchronisées du
 * rendu (`LessonView`) : des composants y figuraient, d'autres manquaient.
 */
function getRelevantComponents(): { interactive: string[]; visual: string[] } {
  return {
    interactive: listFunctionalInteractiveNames(),
    visual: listNames('visual'),
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

    const { interactive: relevantInteractive, visual: relevantVisual } = getRelevantComponents();

    const input: GenerateLessonContentInput = {
      lessonTitle: lessonPlan.title,
      lessonObjective: lessonPlan.objective,
      courseTopic: course.title,
      targetAudience: generationParams?.targetAudience || 'Débutants',
      courseLanguage: generationParams?.courseLanguage || 'Français',
      lessonLength: generationParams?.lessonLength || 'Moyen',
      chapterContext,
      availableInteractiveComponents: relevantInteractive,
      availableVisualComponents: relevantVisual,
    };

    const result = await generateLessonContent(input);
    const { illustrativeContent, interactiveComponentName, visualComponentName } = result;

    tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].content = illustrativeContent;
    tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].interactiveComponentName = interactiveComponentName;
    tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].visualComponentName = visualComponentName;

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

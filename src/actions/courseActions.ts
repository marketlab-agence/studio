
'use server';

import { revalidatePath } from 'next/cache';
import { type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { getCourses, saveCourses } from '@/lib/courses';
import { getTutorials, saveTutorials } from '@/lib/tutorials';
import { getQuizzes, saveQuizzes } from '@/lib/quiz';
import type { Tutorial, Lesson, Quiz, Question, GenerateLessonContentOutput } from '@/types/tutorial.types';
import type { CourseInfo } from '@/types/course.types';
import { generateLessonContent, type GenerateLessonContentInput } from '@/ai/flows/generate-lesson-content-flow';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { GlobalProgress } from '@/types/tutorial.types';
import { FieldValue } from 'firebase-admin/firestore';
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
    const { db } = await getFirebaseAdmin();
    const courses = await getCourses(db);
    
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

    await saveCourses(db, courses);
    revalidatePath('/admin/courses');
    return { courseId };
}


export async function buildCourseFromPlanAction(courseId: string) {
    const { db } = await getFirebaseAdmin();
    // 1. Get the most up-to-date data from Firestore
    const courses = await getCourses(db);
    const course = courses.find(c => c.id === courseId);

    if (!course || !course.plan) {
        throw new Error("Course or its plan not found in Firestore.");
    }

    const plan = course.plan;
    
    // 2. Fetch existing tutorials and quizzes
    let tutorials = await getTutorials(db);
    let quizzes = await getQuizzes(db);

    // 3. Build structure based on the reliable plan from Firestore
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
    
    await saveCourses(db, courses);
    await saveTutorials(db, tutorials);
    await saveQuizzes(db, quizzes);

    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
}


export async function publishCourseAction(courseId: string) {
    const { db } = await getFirebaseAdmin();
    const courses = await getCourses(db);
    const course = courses.find(c => c.id === courseId);
    if (course) {
        course.status = 'Publié';
        await saveCourses(db, courses);
        revalidatePath('/admin');
        revalidatePath('/admin/courses');
        revalidatePath(`/admin/courses/${courseId}`);
    }
}

export async function getCourseAndChaptersAction(courseId: string): Promise<{ course: CourseInfo | undefined, chapters: Tutorial[] }> {
    const { db } = await getFirebaseAdmin();
    const courses = await getCourses(db);
    const tutorials = await getTutorials(db);
    const course = courses.find(c => c.id === courseId);
    const chapters = tutorials.filter(t => t.courseId === courseId);
    return { course, chapters };
}

export async function updateLessonContentAction(courseId: string, chapterId: string, updatedLesson: Lesson) {
    const { db } = await getFirebaseAdmin();
    const tutorials = await getTutorials(db);
    const chapterIndex = tutorials.findIndex(t => t.id === chapterId);
    if (chapterIndex === -1) {
        throw new Error('Chapter not found');
    }
    const lessonIndex = tutorials[chapterIndex].lessons.findIndex(l => l.id === updatedLesson.id);
    if (lessonIndex === -1) {
        throw new Error('Lesson not found');
    }
    tutorials[chapterIndex].lessons[lessonIndex] = updatedLesson;
    await saveTutorials(db, tutorials);

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
  console.log(`[generateLessonContentAction] Starting for courseId: ${courseId}, chapterIndex: ${chapterIndex}, lessonIndex: ${lessonIndex}`);
  try {
    const { db } = await getFirebaseAdmin();
    console.log('[generateLessonContentAction] Firebase Admin SDK obtained.');

    const courses = await getCourses(db);
    const tutorials = await getTutorials(db);
    console.log('[generateLessonContentAction] Courses and Tutorials fetched.');

    const course = courses.find((c) => c.id === courseId);
    if (!course || !course.plan) {
      console.error('[generateLessonContentAction] Course or course plan not found.', { courseExists: !!course, planExists: !!course?.plan });
      throw new Error('Course or course plan not found.');
    }
    console.log('[generateLessonContentAction] Course and plan found.');

    const generationParams = course.generationParams;
    if (!generationParams) {
      console.warn('[generateLessonContentAction] No generationParams found for course.');
    }

    const chapterPlan = course.plan.chapters[chapterIndex];
    const lessonPlan = chapterPlan?.lessons[lessonIndex];
    console.log('[generateLessonContentAction] Chapter and lesson plans accessed.', { chapterPlanExists: !!chapterPlan, lessonPlanExists: !!lessonPlan });

    const chapterId = `${courseId}-ch${chapterIndex + 1}`;
    const lessonId = `${chapterId}-l${lessonIndex + 1}`;

    const tutorialChapterIndex = tutorials.findIndex((t) => t.id === chapterId);
    const tutorialLessonIndex = tutorials[tutorialChapterIndex]?.lessons.findIndex((l) => l.id === lessonId);
    console.log('[generateLessonContentAction] Tutorial chapter and lesson indices found.', { tutorialChapterIndex, tutorialLessonIndex });

    if (!lessonPlan || tutorialChapterIndex === -1 || typeof tutorialLessonIndex === 'undefined' || tutorialLessonIndex === -1) {
      console.error('[generateLessonContentAction] Lesson plan or tutorial structure mismatch.', { lessonPlanExists: !!lessonPlan, tutorialChapterIndex, tutorialLessonIndex });
      throw new Error('Lesson plan or tutorial lesson structure not found.');
    }
    console.log('[generateLessonContentAction] Tutorial structure matched with plan.');

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

    console.log('[generateLessonContentAction] Chapter context created.');

    const { interactive: relevantInteractive, visual: relevantVisual } = getRelevantComponents();
    console.log('[generateLessonContentAction] Relevant components identified.', { relevantInteractive, relevantVisual });

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
    console.log('[generateLessonContentAction] Input for AI model prepared.', input);

    console.log('[generateLessonContentAction] Calling AI model...');
    const result = await generateLessonContent(input);
    const { illustrativeContent, interactiveComponentName, visualComponentName } = result;
    console.log('[generateLessonContentAction] AI model call complete. Result:', result);

    tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].content = illustrativeContent;
    tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].interactiveComponentName = interactiveComponentName;
    tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].visualComponentName = visualComponentName;
    console.log('[generateLessonContentAction] Tutorial data updated with generated content.');

    await saveTutorials(db, tutorials);
    console.log('[generateLessonContentAction] Tutorials saved to Firestore.');

    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
    
    return result;
  } catch (error) {
    console.error(`[generateLessonContentAction] Failed for courseId: ${courseId}`, error);
    throw new Error('Failed to generate lesson content.');
  }
}


export async function updateQuizAction(courseId: string, chapterId: string, updatedQuiz: Quiz) {
    const { db } = await getFirebaseAdmin();
    const quizzes = await getQuizzes(db);
    if (!quizzes[chapterId]) {
        throw new Error('Quiz not found');
    }
    quizzes[chapterId] = updatedQuiz;
    await saveQuizzes(db, quizzes);

    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/quiz`);
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
}

export async function deleteCourseAction(courseId: string) {
    const { db } = await getFirebaseAdmin();

    try {
        await db.runTransaction(async (transaction) => {
            // 1. Get all tutorials for the course to find their IDs
            const tutorialsSnapshot = await transaction.get(
                db.collection('tutorials').where('courseId', '==', courseId)
            );
            const tutorialIds = tutorialsSnapshot.docs.map(doc => doc.id);

            // 2. Delete the course document
            transaction.delete(db.collection('courses').doc(courseId));
            console.log(`Course ${courseId} marked for deletion.`);

            // 3. Delete associated tutorials
            tutorialsSnapshot.docs.forEach(doc => {
                transaction.delete(doc.ref);
            });
            console.log(`Tutorials for course ${courseId} marked for deletion.`);

            // 4. Delete associated quizzes
            tutorialIds.forEach(id => {
                transaction.delete(db.collection('quizzes').doc(id));
            });
            console.log(`Quizzes for course ${courseId} marked for deletion.`);

            // 5. Clean up user progress data
            const usersSnapshot = await transaction.get(db.collection('users'));
            if (!usersSnapshot.empty) {
                usersSnapshot.docs.forEach(userDoc => {
                    const progressDocRef = db.collection('users').doc(userDoc.id).collection('progress').doc('all');
                     // We use an update with FieldValue.delete() to remove a specific field from the document
                    transaction.update(progressDocRef, {
                      [courseId]: FieldValue.delete()
                    });
                });
                console.log(`User progress for course ${courseId} marked for cleanup.`);
            }
        });

        console.log(`Transaction successfully committed for deleting course ${courseId}.`);
        revalidatePath('/admin/courses');
        revalidatePath('/dashboard');
    } catch (error) {
        console.error(`Transaction failed for deleting course ${courseId}: `, error);
        throw new Error("Failed to delete course and associated data.");
    }
}
    

    

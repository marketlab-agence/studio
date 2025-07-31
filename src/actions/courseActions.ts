
'use server';

import { revalidatePath } from 'next/cache';
import { type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { getCourses, saveCourses, getCourseById, deleteCourse } from '@/lib/courses';
import { getTutorials, saveTutorials } from '@/lib/tutorials';
import { getQuizzes, saveQuizzes, createOrUpdateQuiz } from '@/lib/quiz';
import type { Tutorial, Lesson, Quiz, Question, GenerateLessonContentOutput } from '@/types/tutorial.types';
import type { CourseInfo } from '@/types/course.types';
import { generateLessonContent, type GenerateLessonContentInput } from '@/ai/flows/generate-lesson-content-flow';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

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
    const course = await getCourseById(db, courseId);

    if (!course || !course.plan) {
        throw new Error("Course or its plan not found in Firestore.");
    }

    const plan = course.plan;
    
    let tutorials = await getTutorials(db);
    let quizzes = await getQuizzes(db);

    plan.chapters.forEach((chapterPlan, chapterIndex) => {
        const chapterId = `${courseId}-ch${chapterIndex + 1}`;
        
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
    
    const allCourses = await getCourses(db);
    const courseIndexToUpdate = allCourses.findIndex(c => c.id === courseId);
    if(courseIndexToUpdate !== -1) {
        allCourses[courseIndexToUpdate] = {
            ...course,
            status: 'Brouillon',
        };
    }
    
    await saveCourses(db, allCourses);
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

const INTERACTIVE_COMPONENTS = [
    "AiHelper", "BranchCreator", "CollaborationSimulator", "ConflictResolver", 
    "GitCommandSimulator", "GitDoctorTool", "GitRepositoryPlayground", "GitTimeTravel", 
    "MergeSimulator", "PullRequestCreator", "WorkflowDesigner", "VersioningDemo", 
    "StagingAreaVisualizer", "PushPullAnimator", "ForkVsCloneDemo", "PRWorkflowSimulator", 
    "ConflictPlayground", "UndoCommandComparison", "TimelineNavigator", "ReflogExplorer", 
    "GitHubInterfaceSimulator", "IssueTracker", "ActionsWorkflowBuilder", "OpenSourceSimulator", 
    "ProjectDashboard", "WorkflowComparisonTable", "WorkflowSimulator", "CommitMessageLinter", 
    "GitignoreTester", "AliasCreator", "SecurityScanner"
];

const VISUAL_COMPONENTS = [
    "AnimatedFlow", "BranchDiagram", "CommitTimeline", "ConceptDiagram", "DiffViewer", 
    "GitGraph", "RepoComparison", "StatisticsChart", "LanguagesChart", 
    "TrunkBasedDevelopmentVisualizer", "ConflictVisualizer"
];

function getRelevantComponents(courseId: string): { interactive: string[], visual: string[] } {
    const GENERIC_INTERACTIVE = [ "AiHelper" ];
    const GENERIC_VISUAL = ["AnimatedFlow", "ConceptDiagram", "StatisticsChart"];

    const TECHNICAL_COURSES = ["git-github-tutorial", "le-closing-pour-debutants-de-prospect-a-client", "introduction-au-marketing-digital", "jira-de-zero-a-heros", "automatisation-de-processus-informatique-pour-debutants-avec-n8n"];

    if (TECHNICAL_COURSES.includes(courseId)) {
        return { interactive: INTERACTIVE_COMPONENTS, visual: VISUAL_COMPONENTS };
    }

    return { interactive: GENERIC_INTERACTIVE, visual: GENERIC_VISUAL };
}


export async function generateLessonContentAction(
  courseId: string,
  chapterIndex: number,
  lessonIndex: number,
): Promise<GenerateLessonContentOutput> {
  const { db } = await getFirebaseAdmin();
  const courses = await getCourses(db);
  const tutorials = await getTutorials(db);
  
  const course = courses.find(c => c.id === courseId);
  if (!course || !course.plan) {
    throw new Error('Course or course plan not found.');
  }

  const generationParams = course.generationParams;
  const chapterPlan = course.plan.chapters[chapterIndex];
  const lessonPlan = chapterPlan?.lessons[lessonIndex];

  const chapterId = `${courseId}-ch${chapterIndex + 1}`;
  const lessonId = `${chapterId}-l${lessonIndex + 1}`;
  
  const tutorialChapterIndex = tutorials.findIndex(t => t.id === chapterId);
  const tutorialLessonIndex = tutorials[tutorialChapterIndex]?.lessons.findIndex(l => l.id === lessonId);

  if (!lessonPlan || tutorialChapterIndex === -1 || typeof tutorialLessonIndex === "undefined" || tutorialLessonIndex === -1) {
    throw new Error('Lesson plan or tutorial lesson structure not found.');
  }

  const contextLines = [
    'Contexte du cours:',
    '',
    `${course.title}`,
    `Description: ${course.plan.description}`,
    '',
    'Plan complet des chapitres:',
    ...course.plan.chapters.map(c => `- ${c.title}`),
    '',
    'Leçons de ce chapitre:',
    ...chapterPlan.lessons.map(l => `- ${l.title}: ${l.objective}`),
  ];

  const chapterContext = contextLines.join('\n');
  const { interactive: relevantInteractive, visual: relevantVisual } = getRelevantComponents(courseId);

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
  
  await saveTutorials(db, tutorials);

  revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
  revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
  return result;
}

export async function getCourseAndChaptersAction(courseId: string) {
    const { db } = await getFirebaseAdmin();
    const course = await getCourseById(db, courseId);
    const tutorials = await getTutorials(db);
    const chapters = tutorials.filter(t => t.courseId === courseId);
    return { course, chapters };
}


export async function updateLessonContentAction(courseId: string, chapterId: string, lesson: Lesson) {
  const { db } = await getFirebaseAdmin();
  const tutorials = await getTutorials(db);
  const chapterIndex = tutorials.findIndex(t => t.id === chapterId);
  if (chapterIndex !== -1) {
    const lessonIndex = tutorials[chapterIndex].lessons.findIndex(l => l.id === lesson.id);
    if (lessonIndex !== -1) {
      tutorials[chapterIndex].lessons[lessonIndex] = lesson;
      await saveTutorials(db, tutorials);
      revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`);
    }
  }
}

export async function deleteCourseAction(courseId: string) {
    const { db } = await getFirebaseAdmin();
    
    // Delete course document
    await deleteCourse(db, courseId);

    // Delete associated tutorials (chapters)
    const tutorials = await getTutorials(db);
    const tutorialsToDelete = tutorials.filter(t => t.courseId === courseId);
    const tutorialsToKeep = tutorials.filter(t => t.courseId !== courseId);
    if (tutorialsToDelete.length > 0) {
        await saveTutorials(db, tutorialsToKeep);
    }
    
    // Delete associated quizzes
    const quizzes = await getQuizzes(db);
    const quizIdsToDelete = tutorialsToDelete.map(t => t.id);
    const quizzesToKeep: Record<string, Quiz> = {};
    Object.keys(quizzes).forEach(key => {
        if (!quizIdsToDelete.includes(key)) {
            quizzesToKeep[key] = quizzes[key];
        }
    });

    if (Object.keys(quizzes).length !== Object.keys(quizzesToKeep).length) {
        await saveQuizzes(db, quizzesToKeep);
    }

    revalidatePath('/admin/courses');
}

export async function updateQuizAction(courseId: string, chapterId: string, quiz: Quiz) {
  const { db } = await getFirebaseAdmin();
  await createOrUpdateQuiz(db, quiz);
  revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/quiz`);
}

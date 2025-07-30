
'use server';

import { revalidatePath } from 'next/cache';
import { type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { getCourses, saveCourses } from '@/lib/courses';
import { getTutorials, saveTutorials } from '@/lib/tutorials';
import { getQuizzes, saveQuizzes } from '@/lib/quiz';
import type { Tutorial, Lesson, Quiz, Question, GenerateLessonContentOutput } from '@/types/tutorial.types';
import type { CourseInfo } from '@/types/course.types';
import { generateLessonContent, type GenerateLessonContentInput } from '@/ai/flows/generate-lesson-content-flow';
import { db } from '@/lib/firebase-admin';

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
    const courses = await getCourses(db);
    
    const courseId = slugify(plan.title);
    
    // Remove any existing course with the same ID to prevent duplicates/stale data
    const updatedCourses = courses.filter(c => c.id !== courseId);
    
    updatedCourses.push({
        id: courseId,
        title: plan.title,
        description: plan.description,
        status: 'Plan',
        plan: plan,
        generationParams: params,
    });

    await saveCourses(db, updatedCourses);
    revalidatePath('/admin/courses');
    return { courseId };
}


export async function buildCourseFromPlanAction(courseId: string) {
    const courses = await getCourses(db);
    const tutorials = await getTutorials(db);
    const quizzes = await getQuizzes(db);

    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
        console.error("Course not found for building");
        return;
    }
    
    const course = courses[courseIndex];
    const plan = course.plan;

    if (!plan) {
        console.error("Plan not found for building course");
        return;
    }

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

        const quizQuestions: Question[] = chapterPlan.quiz.questions.map((q, questionIndex) => ({
            id: `${chapterId}-q${questionIndex + 1}`,
            text: q.text,
            answers: q.answers.map((a, answerIndex) => ({
                id: `${chapterId}-q${questionIndex + 1}-a${answerIndex + 1}`,
                text: a.text,
                isCorrect: a.isCorrect,
            })),
            isMultipleChoice: q.isMultipleChoice,
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

    courses[courseIndex] = {
        ...course,
        status: 'Brouillon',
    };
    
    await saveCourses(db, courses);
    await saveTutorials(db, tutorials);
    await saveQuizzes(db, quizzes);

    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
}


export async function publishCourseAction(courseId: string) {
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

    const TECHNICAL_COURSES = ["git-github-tutorial", "jira-de-zero-a-heros"];

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

  const chapterContext = `Contexte du cours:
Titre du cours: ${course.title}
Description: ${course.plan.description}
Plan complet des chapitres:
${course.plan.chapters.map(c => `- ${c.title}`).join('\n')}

Leçons de ce chapitre:
${chapterPlan.lessons.map(l => `- ${l.title}: ${l.objective}`).join('\n')}`;

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

  const { illustrativeContent, interactiveComponentName, visualComponentName } = await generateLessonContent(input);

  tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].content = illustrativeContent;
  tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].interactiveComponentName = interactiveComponentName;
  tutorials[tutorialChapterIndex].lessons[tutorialLessonIndex].visualComponentName = visualComponentName;
  
  await saveTutorials(db, tutorials);

  revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);

  return { illustrativeContent, interactiveComponentName, visualComponentName };
}


export async function getCourseAndChaptersAction(courseId: string): Promise<{ course: CourseInfo | null, chapters: Tutorial[] }> {
    const courses = await getCourses(db);
    const tutorials = await getTutorials(db);
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        return { course: null, chapters: [] };
    }
    const chapters = tutorials.filter(t => t.courseId === courseId);
    return { course, chapters };
}

export async function updateLessonContentAction(courseId: string, chapterId: string, lesson: Lesson) {
    const tutorials = await getTutorials(db);
    const chapterIndex = tutorials.findIndex(t => t.id === chapterId);
    if (chapterIndex === -1) {
        throw new Error('Chapter not found');
    }

    const lessonIndex = tutorials[chapterIndex].lessons.findIndex(l => l.id === lesson.id);
    if (lessonIndex === -1) {
        throw new Error('Lesson not found');
    }

    tutorials[chapterIndex].lessons[lessonIndex] = lesson;

    await saveTutorials(db, tutorials);
    
    // Revalidate paths to reflect changes
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`);
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
}

export async function updateQuizAction(courseId: string, chapterId: string, updatedQuiz: Quiz) {
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
    let courses = await getCourses(db);
    let tutorials = await getTutorials(db);
    let quizzes = await getQuizzes(db);

    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
        throw new Error('Course not found for deletion');
    }

    // Identify associated tutorials and their IDs before modifying arrays
    const tutorialIdsToDelete = new Set(tutorials.filter(t => t.courseId === courseId).map(t => t.id));

    // Remove the course and associated tutorials
    courses = courses.filter(c => c.id !== courseId);
    tutorials = tutorials.filter(t => t.courseId !== courseId);

    // Remove associated quizzes
    tutorialIdsToDelete.forEach(id => {
        if (quizzes[id]) {
            delete quizzes[id];
        }
    });

    await saveCourses(db, courses);
    await saveTutorials(db, tutorials);
    await saveQuizzes(db, quizzes);

    revalidatePath('/admin/courses');
}

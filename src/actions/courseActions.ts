
'use server';

import { revalidatePath } from 'next/cache';
import { type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { COURSES, saveCourses } from '@/lib/courses';
import { TUTORIALS, saveTutorials } from '@/lib/tutorials';
import { QUIZZES, saveQuizzes } from '@/lib/quiz';
import type { Tutorial, Lesson, Quiz, Question, GenerateLessonContentOutput } from '@/types/tutorial.types';
import type { CourseInfo } from '@/types/course.types';
import { generateLessonContent, type GenerateLessonContentInput } from '@/ai/flows/generate-lesson-content-flow';

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
    const courseId = slugify(plan.title);
    
    if (!COURSES.find(c => c.id === courseId)) {
        COURSES.push({
            id: courseId,
            title: plan.title,
            description: plan.description,
            status: 'Plan',
            plan: plan,
            generationParams: params,
        });
    } else {
        const index = COURSES.findIndex(c => c.id === courseId);
        if (index !== -1) {
            COURSES[index] = {
                ...COURSES[index],
                title: plan.title,
                description: plan.description,
                status: 'Plan',
                plan: plan,
                generationParams: params,
            };
        }
    }

    await saveCourses();
    revalidatePath('/admin/courses');
    return { courseId };
}


export async function buildCourseFromPlanAction(courseId: string) {
    const courseIndex = COURSES.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
        console.error("Course not found for building");
        return;
    }
    
    const course = COURSES[courseIndex];
    const plan = course.plan;

    if (!plan) {
        console.error("Plan not found for building course");
        return;
    }

    plan.chapters.forEach((chapterPlan, chapterIndex) => {
        const chapterId = `${courseId}-ch${chapterIndex + 1}`;
        
        if (TUTORIALS.find(t => t.id === chapterId)) return;

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
        TUTORIALS.push(newTutorial);

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
        QUIZZES[chapterId] = newQuiz;
    });

    COURSES[courseIndex] = {
        ...course,
        status: 'Brouillon',
    };
    
    await saveCourses();
    await saveTutorials();
    await saveQuizzes();

    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
}


export async function publishCourseAction(courseId: string) {
    const course = COURSES.find(c => c.id === courseId);
    if (course) {
        course.status = 'Publié';
        await saveCourses();
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

export async function generateAndSaveLessonContent(
  courseId: string,
  chapterIndex: number,
  lessonIndex: number,
): Promise<GenerateLessonContentOutput> {
  const course = COURSES.find(c => c.id === courseId);
  if (!course || !course.plan) {
    throw new Error('Course or course plan not found.');
  }
  
  const generationParams = course.generationParams;
  if (!generationParams) {
    throw new Error('Course generation parameters not found.');
  }

  const chapterPlan = course.plan.chapters[chapterIndex];
  const lessonPlan = chapterPlan?.lessons[lessonIndex];
  
  const chapterId = `${courseId}-ch${chapterIndex + 1}`;
  const lessonId = `${chapterId}-l${lessonIndex + 1}`;

  const tutorialChapterIndex = TUTORIALS.findIndex(t => t.id === chapterId);
  const tutorialLessonIndex = TUTORIALS[tutorialChapterIndex]?.lessons.findIndex(l => l.id === lessonId);

  if (!lessonPlan || tutorialChapterIndex === -1 || tutorialLessonIndex === -1 ) {
    throw new Error('Lesson plan or tutorial lesson structure not found.');
  }
  
  const chapterContext = `Contexte du cours:
Titre du cours: ${course.plan.title}
Description: ${course.plan.description}
Plan complet des chapitres:
${course.plan.chapters.map(c => `- ${c.title}`).join('\n')}

Leçons de ce chapitre:
${chapterPlan.lessons.map(l => `- ${l.title}: ${l.objective}`).join('\n')}`;

  const input: GenerateLessonContentInput = {
    lessonTitle: lessonPlan.title,
    lessonObjective: lessonPlan.objective,
    courseTopic: generationParams.topic,
    targetAudience: generationParams.targetAudience,
    courseLanguage: generationParams.courseLanguage,
    chapterContext,
    availableInteractiveComponents: INTERACTIVE_COMPONENTS,
    availableVisualComponents: VISUAL_COMPONENTS,
  };

  const generatedLesson = await generateLessonContent(input);

  TUTORIALS[tutorialChapterIndex].lessons[tutorialLessonIndex].content = generatedLesson.illustrativeContent;
  TUTORIALS[tutorialChapterIndex].lessons[tutorialLessonIndex].interactiveComponentName = generatedLesson.interactiveComponentName;
  TUTORIALS[tutorialChapterIndex].lessons[tutorialLessonIndex].visualComponentName = generatedLesson.visualComponentName;
  
  await saveTutorials();

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);

  return generatedLesson;
}

export async function getCourseAndChapters(courseId: string): Promise<{ course: CourseInfo | null, chapters: Tutorial[] }> {
    const course = COURSES.find(c => c.id === courseId);
    if (!course) {
        return { course: null, chapters: [] };
    }
    const chapters = TUTORIALS.filter(t => t.courseId === courseId);
    return { course, chapters };
}


'use server';

import { revalidatePath } from 'next/cache';
import { collection, doc, writeBatch, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
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
    const courseRef = doc(db, 'courses', courseId);
    
    const courseData: CourseInfo = {
        id: courseId,
        title: plan.title,
        description: plan.description,
        status: 'Plan',
        plan: plan,
        generationParams: params,
    };
    
    await setDoc(courseRef, courseData, { merge: true });

    revalidatePath('/admin/courses');
    return { courseId };
}


export async function buildCourseFromPlanAction(courseId: string) {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
        console.error("Course not found for building");
        return;
    }
    
    const course = courseSnap.data() as CourseInfo;
    const plan = course.plan;

    if (!plan) {
        console.error("Plan not found for building course");
        return;
    }
    
    const batch = writeBatch(db);

    plan.chapters.forEach((chapterPlan, chapterIndex) => {
        const chapterId = `${courseId}-ch${chapterIndex + 1}`;
        const chapterRef = doc(db, 'courses', courseId, 'chapters', chapterId);

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
        batch.set(chapterRef, newTutorial);

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
        const quizRef = doc(db, 'courses', courseId, 'quizzes', chapterId);
        batch.set(quizRef, newQuiz);
    });

    batch.update(courseRef, { status: 'Brouillon' });
    
    await batch.commit();

    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
}


export async function publishCourseAction(courseId: string) {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, { status: 'Publié' });

    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
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
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  
  if (!courseSnap.exists()) {
    throw new Error('Course or course plan not found.');
  }

  const course = courseSnap.data() as CourseInfo;
  if (!course.plan) {
    throw new Error('Course plan not found.');
  }

  const generationParams = course.generationParams;
  const chapterPlan = course.plan.chapters[chapterIndex];
  const lessonPlan = chapterPlan?.lessons[lessonIndex];

  const chapterId = `${courseId}-ch${chapterIndex + 1}`;
  const lessonId = `${chapterId}-l${lessonIndex + 1}`;
  
  const chapterRef = doc(db, 'courses', courseId, 'chapters', chapterId);
  const chapterSnap = await getDoc(chapterRef);

  if (!lessonPlan || !chapterSnap.exists()) {
    throw new Error('Lesson plan or tutorial lesson structure not found.');
  }

  const chapterData = chapterSnap.data() as Tutorial;

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
  
  const tutorialLessonIndex = chapterData.lessons.findIndex(l => l.id === lessonId);
  if (tutorialLessonIndex === -1) {
    throw new Error('Lesson not found in chapter document.');
  }

  chapterData.lessons[tutorialLessonIndex].content = illustrativeContent;
  chapterData.lessons[tutorialLessonIndex].interactiveComponentName = interactiveComponentName;
  chapterData.lessons[tutorialLessonIndex].visualComponentName = visualComponentName;
  
  await updateDoc(chapterRef, { lessons: chapterData.lessons });

  revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);

  return { illustrativeContent, interactiveComponentName, visualComponentName };
}


export async function getCourseAndChapters(courseId: string): Promise<{ course: CourseInfo | null, chapters: Tutorial[] }> {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
        return { course: null, chapters: [] };
    }

    const chaptersCol = collection(db, 'courses', courseId, 'chapters');
    const chaptersSnap = await getDocs(chaptersCol);
    const chapters = chaptersSnap.docs.map(doc => doc.data() as Tutorial);

    return { course: { id: courseSnap.id, ...courseSnap.data() } as CourseInfo, chapters };
}

export async function updateLessonContent(courseId: string, chapterId: string, lesson: Lesson) {
    const chapterRef = doc(db, 'courses', courseId, 'chapters', chapterId);
    const chapterSnap = await getDoc(chapterRef);

    if (!chapterSnap.exists()) {
        throw new Error('Chapter not found');
    }

    const chapterData = chapterSnap.data() as Tutorial;
    const lessonIndex = chapterData.lessons.findIndex(l => l.id === lesson.id);

    if (lessonIndex === -1) {
        throw new Error('Lesson not found');
    }
    
    chapterData.lessons[lessonIndex] = lesson;
    await updateDoc(chapterRef, { lessons: chapterData.lessons });
    
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`);
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
}

export async function updateQuiz(courseId: string, chapterId: string, updatedQuiz: Quiz) {
    const quizRef = doc(db, 'courses', courseId, 'quizzes', chapterId);
    await setDoc(quizRef, updatedQuiz, { merge: true });

    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}/quiz`);
    revalidatePath(`/admin/courses/${courseId}/chapters/${chapterId}`);
}

export async function deleteCourseAction(courseId: string) {
    // Note: This deletes the main course document, but not its subcollections (chapters, quizzes).
    // A proper recursive delete requires a Firebase Function or manual deletion.
    // For this prototype, we'll accept orphaned subcollections.
    const courseRef = doc(db, 'courses', courseId);
    await deleteDoc(courseRef);
    revalidatePath('/admin/courses');
}

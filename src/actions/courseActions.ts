
'use server';

import { revalidatePath } from 'next/cache';
import { type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { COURSES } from '@/lib/courses';
import { TUTORIALS } from '@/lib/tutorials';
import { QUIZZES } from '@/lib/quiz';
import type { Tutorial, Lesson, Quiz, Question } from '@/types/tutorial.types';

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
            content: `# ${lessonPlan.title}\n\nContenu de la leçon à rédiger...`,
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
        plan: undefined,
        generationParams: undefined,
    };
    
    revalidatePath('/admin');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
}


export async function publishCourseAction(courseId: string) {
    const course = COURSES.find(c => c.id === courseId);
    if (course) {
        course.status = 'Publié';
        revalidatePath('/admin');
        revalidatePath('/admin/courses');
        revalidatePath(`/admin/courses/${courseId}`);
    }
}

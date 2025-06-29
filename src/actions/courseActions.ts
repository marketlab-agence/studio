
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { type CreateCourseOutput } from '@/ai/flows/create-course-flow';
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

export async function saveCoursePlanAction(plan: CreateCourseOutput) {
    const courseId = slugify(plan.title);
    
    // 1. Add course to registry
    if (!COURSES.find(c => c.id === courseId)) {
        COURSES.push({
            id: courseId,
            title: plan.title,
            description: plan.description,
            status: 'Brouillon',
        });
    }

    // 2. Create and add chapters, lessons, and quizzes
    plan.chapters.forEach((chapterPlan, chapterIndex) => {
        const chapterId = `${courseId}-ch${chapterIndex + 1}`;
        
        // Ensure chapter doesn't already exist before adding
        if (TUTORIALS.find(t => t.id === chapterId)) return;

        // Create lessons
        const lessons: Lesson[] = chapterPlan.lessons.map((lessonPlan, lessonIndex) => ({
            id: `${chapterId}-l${lessonIndex + 1}`,
            title: lessonPlan.title,
            objective: lessonPlan.objective,
            content: `# ${lessonPlan.title}\n\nContenu de la leçon à rédiger...`, // Placeholder content
        }));

        // Create tutorial (chapter)
        const newTutorial: Tutorial = {
            id: chapterId,
            courseId: courseId,
            title: chapterPlan.title,
            description: `Un chapitre sur ${chapterPlan.title}.`,
            lessons: lessons,
        };
        TUTORIALS.push(newTutorial);

        // Create quiz
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

    revalidatePath('/admin');
    redirect(`/admin/courses/${courseId}`);
}

export async function publishCourseAction(courseId: string) {
    const course = COURSES.find(c => c.id === courseId);
    if (course) {
        course.status = 'Publié';
        revalidatePath('/admin');
        revalidatePath(`/admin/courses/${courseId}`);
    }
}

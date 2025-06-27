'use server';
/**
 * @fileOverview An AI flow for generating structured course plans.
 *
 * - createCoursePlan - A function that generates a course plan based on a topic.
 * - CreateCourseInput - The input type for the createCoursePlan function.
 * - CreateCourseOutput - The return type for the createCoursePlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateCourseInputSchema = z.object({
  topic: z.string().describe('The main topic or subject of the course.'),
  targetAudience: z.string().describe('The intended audience for the course (e.g., beginners, experts).'),
});
export type CreateCourseInput = z.infer<typeof CreateCourseInputSchema>;

const QuizPlanSchema = z.object({
    title: z.string().describe("The title of the chapter's quiz."),
    topics: z.array(z.string()).describe('A list of 3-5 key topics the quiz should cover to validate understanding of the chapter.')
});

const LessonPlanSchema = z.object({
    title: z.string().describe("The specific title of the lesson."),
    objective: z.string().describe("A concise learning objective for the lesson, starting with a verb (e.g., 'Learn to...', 'Understand how to...').")
});

const ChapterPlanSchema = z.object({
    title: z.string().describe("The title of the chapter."),
    lessons: z.array(LessonPlanSchema).describe("A list of lessons for this chapter. There should be between 3 and 5 lessons per chapter."),
    quiz: QuizPlanSchema.describe("A plan for the quiz at the end of the chapter.")
});

const CreateCourseOutputSchema = z.object({
  title: z.string().describe("A catchy and descriptive title for the entire course."),
  description: z.string().describe("A short, one-paragraph description of the course and what the student will learn."),
  chapters: z.array(ChapterPlanSchema).describe("A list of chapters for the course. Generate between 5 and 10 chapters."),
});
export type CreateCourseOutput = z.infer<typeof CreateCourseOutputSchema>;

export async function createCoursePlan(input: CreateCourseInput): Promise<CreateCourseOutput> {
  return createCoursePlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createCoursePrompt',
  input: {schema: CreateCourseInputSchema},
  output: {schema: CreateCourseOutputSchema},
  prompt: `You are an expert instructional designer tasked with creating a comprehensive and engaging online course plan. The user will provide a topic and a target audience.

Your task is to generate a complete course structure, including a course title, a description, a list of chapters, and for each chapter, a list of lessons and a quiz plan.

Course Topic: {{{topic}}}
Target Audience: {{{targetAudience}}}

Please generate the course plan according to the specified output schema. Ensure the content is logical, well-structured, and appropriate for the target audience. The tone should be professional and encouraging.
`,
});

const createCoursePlanFlow = ai.defineFlow(
  {
    name: 'createCoursePlanFlow',
    inputSchema: CreateCourseInputSchema,
    outputSchema: CreateCourseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

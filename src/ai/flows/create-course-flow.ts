
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
  numChapters: z.number().optional().describe('The desired number of chapters.'),
  numLessonsPerChapter: z.number().optional().describe('The desired number of lessons per chapter.'),
  numQuestionsPerQuiz: z.number().optional().describe('The desired number of questions per quiz.'),
  courseLanguage: z.string().optional().describe('The language the course should be written in.'),
  lessonLength: z.enum(['Court', 'Moyen', 'Long']).optional().describe("The desired length for each lesson's content."),
  allowMultipleChoice: z.boolean().optional().describe('Whether to allow generating multiple choice questions in quizzes.'),
  feedbackTiming: z.enum(['immediate', 'end']).optional().describe("The timing for showing correct answers in quizzes. 'immediate' shows feedback after each question, 'end' shows it after the quiz is complete."),
});
export type CreateCourseInput = z.infer<typeof CreateCourseInputSchema>;

const AnswerPlanSchema = z.object({
  text: z.string().describe("The text for a possible answer."),
  isCorrect: z.boolean().describe("Whether this answer is the correct one."),
});

const QuestionPlanSchema = z.object({
  text: z.string().describe("The full text of the quiz question."),
  answers: z.array(AnswerPlanSchema).min(3).max(4).describe("A list of 3-4 possible answers for the question."),
  isMultipleChoice: z.boolean().describe("Whether this is a multiple-choice question (can have multiple correct answers)."),
});

const QuizPlanSchema = z.object({
    title: z.string().describe("The title of the chapter's quiz."),
    questions: z.array(QuestionPlanSchema).describe("A list of questions for this chapter's quiz."),
    feedbackTiming: z.enum(['immediate', 'end']).default('end').describe("The timing for showing correct answers in this quiz."),
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
  prompt: `You are an expert instructional designer tasked with creating a comprehensive and engaging online course plan based on user-provided parameters.

Your task is to generate a complete course structure. You MUST adhere strictly to all the parameters provided below.

**1. Core Content Parameters**
*   **Topic:** {{{topic}}}
*   **Target Audience:** {{{targetAudience}}}
*   **Language:** The entire course plan, including all titles, descriptions, and questions, MUST be in **{{#if courseLanguage}}{{{courseLanguage}}}{{else}}French{{/if}}**.

**2. Structural Parameters**
*   **Number of Chapters:** {{#if numChapters}}Exactly **{{{numChapters}}}** chapters.{{else}}Between **5 and 10** chapters.{{/if}}
*   **Lessons per Chapter:** {{#if numLessonsPerChapter}}Exactly **{{{numLessonsPerChapter}}}** lessons per chapter.{{else}}Between **3 and 5** lessons per chapter.{{/if}}
*   **Desired Lesson Length:** While you will not write the full lesson content now, keep the desired lesson length of **'{{#if lessonLength}}{{{lessonLength}}}{{else}}Moyen{{/if}}'** in mind when defining lesson objectives. A 'Long' lesson should have a more specific and in-depth objective.

**3. Quiz Parameters**
For each chapter, generate a quiz to validate learning.
*   **Number of Questions:** {{#if numQuestionsPerQuiz}}Exactly **{{{numQuestionsPerQuiz}}}** questions per quiz.{{else}}Between **3 and 5** questions per quiz.{{/if}}
*   **Answer Format:** Each question must have between 3 and 4 possible answers.
*   **Question Type:** {{#if allowMultipleChoice}}You can create a mix of single-choice and multiple-choice questions. For single-choice questions, exactly one answer must be \`isCorrect: true\`. For multiple-choice questions, one or more answers can be \`isCorrect: true\`.{{else}}All questions MUST be single-choice, meaning only ONE answer can be \`isCorrect: true\` and \`isMultipleChoice\` must be \`false\`.{{/if}}
*   **Feedback Timing:** The \`feedbackTiming\` property for each quiz must be set to **'{{#if feedbackTiming}}{{{feedbackTiming}}}{{else}}end{{/if}}'**.

Generate the course plan according to the output schema. Ensure all content is logical, well-structured, and perfectly aligned with the target audience and all specified parameters. The tone should be professional and encouraging.
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

    

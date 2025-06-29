
'use server';
/**
 * @fileOverview An AI flow for generating lesson content.
 *
 * - generateLessonContent - A function that generates Markdown content for a given lesson topic.
 * - GenerateLessonContentInput - The input type for the function.
 * - GenerateLessonContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonContentInputSchema = z.object({
  lessonTitle: z.string().describe("The title of the lesson."),
  lessonObjective: z.string().describe("The learning objective for the lesson."),
  courseTopic: z.string().describe("The main topic of the entire course for context."),
  targetAudience: z.string().describe("The target audience for the course."),
  courseLanguage: z.string().optional().describe("The language for the lesson content."),
});
export type GenerateLessonContentInput = z.infer<typeof GenerateLessonContentInputSchema>;

const GenerateLessonContentOutputSchema = z.object({
  content: z.string().describe("The full lesson content in Markdown format. It should be detailed, educational, and include examples and code blocks where relevant."),
});
export type GenerateLessonContentOutput = z.infer<typeof GenerateLessonContentOutputSchema>;

const generateLessonContentPrompt = ai.definePrompt({
    name: 'generateLessonContentPrompt',
    input: { schema: GenerateLessonContentInputSchema },
    output: { schema: GenerateLessonContentOutputSchema },
    prompt: `You are an expert instructional designer creating content for an online course on the topic of **{{{courseTopic}}}**. Your task is to write the content for a single lesson within this course.

**Course Information:**
- Main Topic: {{{courseTopic}}}
- Target Audience: {{{targetAudience}}}

**Lesson to Write:**
- Title: {{{lessonTitle}}}
- Objective: {{{lessonObjective}}}

**Crucial Instructions:**
- The entire lesson MUST be written in the context of **{{{courseTopic}}}**. All examples, explanations, and concepts must be directly related to it. For example, if the topic is "Trello", a lesson on "Collaboration" should explain how to collaborate using Trello's features.
- The content MUST be in {{#if courseLanguage}}{{{courseLanguage}}}{{else}}French{{/if}}.
- The content MUST be in Markdown format.
- Structure the content logically with headings, lists, and paragraphs.
- If the course topic is a software tool, include examples that look like the user is interacting with that tool. Use code blocks for commands or configuration snippets where relevant.
- Ensure the content directly helps the student achieve the stated lesson objective *within the context of the course topic*.
`,
  });

export async function generateLessonContent(input: GenerateLessonContentInput): Promise<GenerateLessonContentOutput> {
  const { output } = await generateLessonContentPrompt(input);
  return output!;
}

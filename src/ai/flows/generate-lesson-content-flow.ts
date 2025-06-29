
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

export async function generateLessonContent(input: GenerateLessonContentInput): Promise<GenerateLessonContentOutput> {
  const prompt = ai.definePrompt({
    name: 'generateLessonContentPrompt',
    input: { schema: GenerateLessonContentInputSchema },
    output: { schema: GenerateLessonContentOutputSchema },
    prompt: `You are an expert instructional designer creating content for an online course. Your task is to write the content for a single lesson.

**Course Information:**
- Topic: {{{courseTopic}}}
- Target Audience: {{{targetAudience}}}

**Lesson Information:**
- Title: {{{lessonTitle}}}
- Objective: {{{lessonObjective}}}

**Instructions:**
- Write comprehensive and engaging lesson content based on the title and objective.
- The content MUST be in {{#if courseLanguage}}{{{courseLanguage}}}{{else}}French{{/if}}.
- The content MUST be in Markdown format.
- Structure the content logically with headings, lists, and paragraphs.
- Include relevant code blocks (using Markdown fences \`\`\`) and examples to illustrate key concepts.
- The tone should be professional, clear, and encouraging for a student.
- Ensure the content directly helps the student achieve the stated lesson objective.
`,
  });

  const { output } = await prompt(input);
  return output!;
}

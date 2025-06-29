
'use server';
/**
 * @fileOverview An AI flow for generating structured lesson content.
 *
 * - generateLessonContent - A function that generates Markdown content and suggests components for a lesson.
 * - GenerateLessonContentInput - The input type for the function.
 * - GenerateLessonContentOutput - The return type for the function is defined in tutorial.types.ts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateLessonContentOutput } from '@/types/tutorial.types';


export const GenerateLessonContentInputSchema = z.object({
  lessonTitle: z.string().describe("The title of the lesson to generate."),
  lessonObjective: z.string().describe("The learning objective for the lesson."),
  courseTopic: z.string().describe("The main topic of the entire course for context."),
  targetAudience: z.string().describe("The target audience for the course."),
  courseLanguage: z.string().optional().describe("The language for the lesson content."),
  chapterContext: z.string().describe("The titles and objectives of other lessons in the same chapter to provide context."),
  availableInteractiveComponents: z.array(z.string()).describe("A list of available interactive React components to choose from."),
  availableVisualComponents: z.array(z.string()).describe("A list of available data visualization React components to choose from.")
});
export type GenerateLessonContentInput = z.infer<typeof GenerateLessonContentInputSchema>;

const GenerateLessonContentOutputSchema = z.object({
  illustrativeContent: z.string().describe("The main educational content for the lesson in Markdown format. This should be well-structured with headings, lists, and code blocks."),
  interactiveComponentName: z.string().describe("The name of a single, most relevant interactive component selected from the provided list."),
  visualComponentName: z.string().describe("The name of a single, most relevant visualization component selected from the provided list.")
});

const generateLessonContentPrompt = ai.definePrompt({
    name: 'generateLessonContentPrompt',
    input: { schema: GenerateLessonContentInputSchema },
    output: { schema: GenerateLessonContentOutputSchema },
    prompt: `You are an expert instructional designer creating a single, engaging, and multi-faceted lesson for an online course.

**Course Context:**
- Main Topic: {{{courseTopic}}}
- Target Audience: {{{targetAudience}}}
- Language: {{#if courseLanguage}}{{{courseLanguage}}}{{else}}French{{/if}}

**Current Lesson Details:**
- Lesson Title: {{{lessonTitle}}}
- Lesson Objective: {{{lessonObjective}}}
- Chapter Context: This lesson is part of a chapter covering:
{{{chapterContext}}}

**Your Task:**
Generate a complete package for this single lesson. You MUST provide three distinct parts in your response, following the output schema:

1.  **Illustrative Content (\`illustrativeContent\`):**
    - Write detailed, educational content in well-formatted Markdown.
    - Use headings, lists, bold text, and code blocks for clarity.
    - All examples MUST be directly related to the course topic: **{{{courseTopic}}}**. For example, if the topic is "Trello", a lesson on "Collaboration" must explain how to collaborate using Trello's features.

2.  **Interactive Component (\`interactiveComponentName\`):**
    - Select ONE component from the provided list of available interactive components that is MOST relevant to the lesson's objective.
    - Your choice should provide a hands-on experience for the student.
    - Available Interactive Components: {{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - You must output only the name of the chosen component.

3.  **Visual Component (\`visualComponentName\`):**
    - Select ONE component from the provided list of available visualization components that BEST illustrates a key concept from the lesson.
    - This should help the student visualize an abstract idea.
    - Available Visualization Components: {{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - You must output only the name of the chosen component.

**Crucial Rules:**
- Focus ONLY on generating content for the lesson titled "{{{lessonTitle}}}". Do not generate content for any other lesson.
- Ensure your component selections are from the exact lists provided.
`,
  });

export async function generateLessonContent(input: GenerateLessonContentInput): Promise<GenerateLessonContentOutput> {
  const { output } = await generateLessonContentPrompt(input);
  return output!;
}

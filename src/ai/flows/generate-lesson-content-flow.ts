
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


const GenerateLessonContentInputSchema = z.object({
  lessonTitle: z.string().describe("The title of the lesson to generate."),
  lessonObjective: z.string().describe("The learning objective for the lesson."),
  courseTopic: z.string().describe("The main topic of the entire course for context."),
  targetAudience: z.string().describe("The target audience for the course."),
  courseLanguage: z.string().optional().describe("The language for the lesson content."),
  chapterContext: z.string().describe("The titles and objectives of other lessons in the same chapter to provide context and the full course plan to give global context."),
  availableInteractiveComponents: z.array(z.string()).describe("A list of available interactive React components to choose from."),
  availableVisualComponents: z.array(z.string()).describe("A list of available data visualization React components to choose from.")
});
export type GenerateLessonContentInput = z.infer<typeof GenerateLessonContentInputSchema>;

const GenerateLessonContentOutputSchema = z.object({
  illustrativeContent: z.string().describe("The main educational content for the lesson in well-structured Markdown format. It should include headings, lists, code blocks, and bold text to explain the concepts clearly."),
  interactiveComponentName: z.string().describe("The name of a single, most relevant interactive component selected from the provided list that would provide a hands-on experience."),
  visualComponentName: z.string().describe("The name of a single, most relevant visualization component selected from the provided list that would help illustrate a key concept.")
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
- Chapter Context & Course Plan:
{{{chapterContext}}}

**Your Task:**
Generate a complete package for this single lesson. You MUST provide three distinct parts in your response, following the output schema:

1.  **Illustrative Content (\`illustrativeContent\`):**
    - Write detailed, educational content in well-formatted Markdown.
    - The content MUST be directly related to the course topic: **{{{courseTopic}}}**. All examples must use this topic. For example, if the topic is "Trello", a lesson on "Collaboration" MUST explain how to collaborate using Trello's features.
    - Structure the content logically with headings, lists, bold text, and code blocks for clarity and readability.

2.  **Interactive Component (\`interactiveComponentName\`):**
    - From the list below, select ONE component that is MOST relevant to the lesson's objective to provide a hands-on experience.
    - Available Interactive Components: {{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - You must output only the name of the chosen component.

3.  **Visual Component (\`visualComponentName\`):**
    - From the list below, select ONE component that BEST illustrates a key concept from the lesson.
    - Available Visualization Components: {{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - You must output only the name of the chosen component.

**Crucial Rules:**
- Focus ONLY on generating content for the lesson titled "{{{lessonTitle}}}". Do not generate content for any other lesson.
- Your component selections MUST come from the exact lists provided. Do not invent new components.
`,
  });

export async function generateLessonContent(input: GenerateLessonContentInput): Promise<GenerateLessonContentOutput> {
  const { output } = await generateLessonContentPrompt(input);
  return output!;
}

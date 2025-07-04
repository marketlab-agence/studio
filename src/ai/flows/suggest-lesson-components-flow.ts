
'use server';
/**
 * @fileOverview An AI flow for suggesting components for a lesson.
 *
 * - suggestLessonComponents - A function that suggests interactive and visual components.
 * - SuggestLessonComponentsInput - The input type for the function.
 * - SuggestLessonComponentsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLessonComponentsInputSchema = z.object({
  lessonTitle: z.string().describe("The title of the lesson."),
  lessonObjective: z.string().describe("The learning objective for the lesson."),
  courseTopic: z.string().describe("The main topic of the entire course."),
  targetAudience: z.string().describe("The target audience for the course."),
  illustrativeContent: z.string().describe("The Markdown content of the lesson, which will be analyzed to suggest relevant components."),
  availableInteractiveComponents: z.array(z.string()).describe("A list of available interactive React components to choose from."),
  availableVisualComponents: z.array(z.string()).describe("A list of available data visualization React components to choose from.")
});
export type SuggestLessonComponentsInput = z.infer<typeof SuggestLessonComponentsInputSchema>;

const SuggestLessonComponentsOutputSchema = z.object({
  interactiveComponentName: z.string().describe("The name of a single, most relevant interactive component selected from the provided list that would provide a hands-on experience."),
  visualComponentName: z.string().describe("The name of a single, most relevant visualization component selected from the provided list that would help illustrate a key concept.")
});
export type SuggestLessonComponentsOutput = z.infer<typeof SuggestLessonComponentsOutputSchema>;

const suggestLessonComponentsPrompt = ai.definePrompt({
    name: 'suggestLessonComponentsPrompt',
    input: { schema: SuggestLessonComponentsInputSchema },
    output: { schema: SuggestLessonComponentsOutputSchema },
    prompt: `You are an expert instructional designer analyzing a lesson to suggest the best pedagogical components.

**Course Context:**
- Main Topic: {{{courseTopic}}}
- Target Audience: {{{targetAudience}}}

**Lesson to Analyze:**
- Lesson Title: {{{lessonTitle}}}
- Lesson Objective: {{{lessonObjective}}}
- Lesson Content (Markdown):
---
{{{illustrativeContent}}}
---

**Your Task:**
Analyze the lesson content and objective. Generate ONLY the names of the most suitable components based on the lists provided.

1.  **Interactive Component (\`interactiveComponentName\`):**
    - From the list below, select ONE component that is MOST relevant to the lesson's objective to provide a hands-on experience.
    - Available Interactive Components: {{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - You must output only the name of the chosen component.

2.  **Visual Component (\`visualComponentName\`):**
    - From the list below, select ONE component that BEST illustrates a key concept from the lesson.
    - Available Visualization Components: {{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - You must output only the name of the chosen component.

**Crucial Rules:**
- DO NOT generate any Markdown content or explanations. Your output must strictly follow the output schema.
- Your component selections MUST come from the exact lists provided. Do not invent new components.
- The choice of components MUST be directly relevant to the course topic: \`{{{courseTopic}}}\` and the lesson title: \`{{{lessonTitle}}}\`.
`,
  });

const suggestLessonComponentsFlow = ai.defineFlow(
  {
    name: 'suggestLessonComponentsFlow',
    inputSchema: SuggestLessonComponentsInputSchema,
    outputSchema: SuggestLessonComponentsOutputSchema,
  },
  async input => {
    const { output } = await suggestLessonComponentsPrompt(input);
    return output!;
  }
);

export async function suggestLessonComponents(input: SuggestLessonComponentsInput): Promise<SuggestLessonComponentsOutput> {
  return suggestLessonComponentsFlow(input);
}

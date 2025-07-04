
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
  interactiveComponentName: z.string().optional().describe("The name of a single, most relevant interactive component selected from the provided list that would provide a hands-on experience. If no component is relevant, this field can be omitted."),
  interactiveComponentJustification: z.string().optional().describe("A brief justification explaining why this interactive component is essential, referencing the lesson content."),
  visualComponentName: z.string().optional().describe("The name of a single, most relevant visualization component selected from the provided list that would help illustrate a key concept. If no component is relevant, this field can be omitted."),
  visualComponentJustification: z.string().optional().describe("A brief justification explaining why this visual component is essential, referencing the lesson content.")
});
export type SuggestLessonComponentsOutput = z.infer<typeof SuggestLessonComponentsOutputSchema>;

const suggestLessonComponentsPrompt = ai.definePrompt({
    name: 'suggestLessonComponentsPrompt',
    input: { schema: SuggestLessonComponentsInputSchema },
    output: { schema: SuggestLessonComponentsOutputSchema },
    prompt: `You are an expert and highly critical instructional designer. Your task is to analyze the provided lesson content and suggest pedagogical components ONLY if they are absolutely essential for enhancing learning. You must justify every suggestion by quoting or referencing a specific part of the lesson content.

**1. Analyze the following content:**

*   **Course Topic:** {{{courseTopic}}}
*   **Lesson Title:** {{{lessonTitle}}}
*   **Lesson Objective:** {{{lessonObjective}}}
*   **Lesson Content (Markdown):**
    ---
    {{{illustrativeContent}}}
    ---

**2. Follow this strict reasoning process:**

*   **Justification First:** Before selecting any component, you must write a justification.
    *   For an **interactive component**, ask: "Is there a specific, practical skill described in the content that the user MUST practice to understand?" If yes, write a justification that explains why and what part of the content supports this.
    *   For a **visual component**, ask: "Is there a complex concept, flow, or data relationship in the content that is very difficult to grasp with text alone?" If yes, write a justification.
*   **If no strong justification can be made, DO NOT suggest a component.** Your output for that component and its justification must be empty. It is better to suggest nothing than to suggest something irrelevant.
*   **Relevance Check:** Your justification and component choice MUST be directly related to the **Course Topic: {{{courseTopic}}}**. Do not suggest Git-related components for a course on Sales.

**3. If, and only if, you have a strong justification, select the single best component from the lists below:**

*   **Available Interactive Components:** {{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
*   **Available Visualization Components:** {{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

**4. Generate your response following the output schema precisely.** Include the component name and its corresponding justification.
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

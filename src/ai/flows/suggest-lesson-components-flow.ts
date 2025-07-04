
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
  visualComponentName: z.string().optional().describe("The name of a single, most relevant visualization component selected from the provided list that would help illustrate a key concept. If no component is relevant, this field can be omitted.")
});
export type SuggestLessonComponentsOutput = z.infer<typeof SuggestLessonComponentsOutputSchema>;

const suggestLessonComponentsPrompt = ai.definePrompt({
    name: 'suggestLessonComponentsPrompt',
    input: { schema: SuggestLessonComponentsInputSchema },
    output: { schema: SuggestLessonComponentsOutputSchema },
    prompt: `You are a highly selective and critical instructional designer. Your task is to analyze the lesson content provided below and decide if an interactive or visual component would genuinely enhance learning. **Most lessons do not need extra components.** Only suggest a component if it is almost *essential* for understanding a complex topic or practicing a key skill described in the lesson content.

**1. Analyze the following content:**

*   **Course Topic:** {{{courseTopic}}}
*   **Lesson Title:** {{{lessonTitle}}}
*   **Lesson Objective:** {{{lessonObjective}}}
*   **Lesson Content (Markdown):**
    ---
    {{{illustrativeContent}}}
    ---

**2. Make a decision based SOLELY on the content provided above:**

-   **First, determine if ANY component is needed.** Is there a specific part of the \`illustrativeContent\` that is hard to grasp with text alone? If not, **your response must be empty.** Do not suggest any components.
-   **If a component is necessary, your choice MUST be directly justified by the \`illustrativeContent\` and the \`courseTopic\`.**
    -   Example: If the \`courseTopic\` is "Git" and the \`illustrativeContent\` describes \`git add\` and \`git commit\`, then \`StagingAreaVisualizer\` is a relevant suggestion.
    -   Example: If the \`courseTopic\` is "Sales" and the \`illustrativeContent\` describes a sales funnel, then \`ConceptDiagram\` might be relevant, but \`GitCommandSimulator\` is **completely irrelevant and must not be chosen**.
-   **If NO component from the list is a good fit, even if it seems vaguely related, DO NOT suggest it.** Omit the fields in your response.

**3. If, and only if, you have decided a component is essential, select the single best component from each list below:**

-   **Available Interactive Components:** {{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
-   **Available Visualization Components:** {{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Your final output must strictly follow the output schema, containing only the names of the selected components, or be empty if none are relevant.
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

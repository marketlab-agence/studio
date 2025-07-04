
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
    prompt: `You are an expert instructional designer with a critical eye. Your primary goal is to determine if a lesson's content justifies adding a complex interactive or visual component. You must be very selective. **An irrelevant component is worse than no component.**

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
Follow this strict two-step process:

**Step 1: Analyze Relevance**
Read the lesson content and objective carefully. Ask yourself: "Is there a key concept here that is *so* complex or abstract that it would be *significantly* clarified by one of the available components? Or is there a practical skill that can *only* be taught through a hands-on simulation?"

- If the answer is no, or if the lesson is simple and self-explanatory, **DO NOT suggest any components.** Your output for the component names should be empty/omitted.
- If the answer is yes, proceed to Step 2.

**Step 2: Select Component (only if absolutely necessary)**
If, and only if, you determined in Step 1 that a component is truly necessary, select the *single best* component from each list below.

**CRUCIAL INSTRUCTION:** The component you select **MUST** be directly and logically related to the **Main Topic: \`{{{courseTopic}}}\`**.
- **If the course topic is highly technical and related to Git, GitHub, or Jira**, you can use specific components like \`GitCommandSimulator\`, \`BranchDiagram\`, \`IssueTracker\`, etc.
- **If the course topic is NOT technical or is on a different subject (e.g., Marketing, Sales, Design)**, you MUST NOT select Git-specific components. Instead, look for generic components like \`AiHelper\`, \`ConceptDiagram\`, \`StatisticsChart\`.
- **If NO component from the list is a good fit for the specific lesson, even if one seems vaguely related to the topic, DO NOT suggest it.** Omit the field.

1.  **Interactive Component (\`interactiveComponentName\`):**
    - From the list below, select ONE component.
    - Available Interactive Components: {{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - If no component is a good fit, omit this field.

2.  **Visual Component (\`visualComponentName\`):**
    - From the list below, select ONE component.
    - Available Visualization Components: {{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
    - If no component is a good fit, omit this field.
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

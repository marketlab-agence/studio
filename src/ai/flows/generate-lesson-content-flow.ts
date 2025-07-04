
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
  lessonLength: z.enum(['Court', 'Moyen', 'Long']).optional().describe("The desired length for the lesson content. 'Court' for a summary, 'Moyen' for standard detail, 'Long' for an in-depth explanation."),
  availableInteractiveComponents: z.array(z.string()).describe("A list of available interactive React components to choose from."),
  availableVisualComponents: z.array(z.string()).describe("A list of available data visualization React components to choose from.")
});
export type GenerateLessonContentInput = z.infer<typeof GenerateLessonContentInputSchema>;

const GenerateLessonContentOutputSchema = z.object({
  illustrativeContent: z.string().describe("The main educational content for the lesson in well-structured Markdown format. It should include headings, lists, code blocks, and bold text to explain the concepts clearly."),
  interactiveComponentName: z.string().optional().describe("The name of a single, most relevant interactive component selected from the provided list that would provide a hands-on experience. If no component is relevant, this field can be omitted."),
  visualComponentName: z.string().optional().describe("The name of a single, most relevant visualization component selected from the provided list that would help illustrate a key concept. If no component is relevant, this field can be omitted.")
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
- Desired Content Length: {{{lessonLength}}}
- Chapter Context & Course Plan:
{{{chapterContext}}}

**Your Task:**
Generate a complete package for this single lesson. You MUST provide three distinct parts in your response, following the output schema:

1.  **Illustrative Content (\`illustrativeContent\`):**
    - Write detailed, high-quality educational content in well-formatted Markdown. The length should correspond to the 'Desired Content Length' specified.
    - The content MUST be directly related to the course topic: **{{{courseTopic}}}**.
    - **The structure MUST be professional, clear, and highly readable.** Follow these formatting rules strictly:
        - Use Markdown headings (\`#\`, \`##\`, \`###\`) to create a clear hierarchy for titles and subtitles.
        - Use **bold** text (\`**text**\`) for key terms to make them stand out.
        - Use numbered lists (\`1.\`, \`2.\`, \`3.\`) or bulleted lists (\`*\`, \`-\`) for enumerations and lists of points.
        - Ensure proper punctuation and grammar throughout the text.
        - **Crucially, ensure there are double line breaks between paragraphs, lists, and headings to create clear visual separation and improve readability.**
    - Write in a didactic and engaging tone. Avoid generic concluding paragraphs; focus on delivering rich, informative content from start to finish.

2.  **Interactive Component (\`interactiveComponentName\`):**
    - Based on the content you just wrote, analyze if a hands-on, practical component would significantly improve understanding.
    - From the list below, select ONE component that is MOST relevant. If no component is truly necessary or relevant, omit this field entirely.
    - Available Interactive Components: {{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

3.  **Visual Component (\`visualComponentName\`):**
    - Based on the content you just wrote, analyze if a visual diagram or chart would clarify a complex concept or relationship.
    - From the list below, select ONE component that BEST illustrates a key concept. If no component is truly necessary or relevant, omit this field entirely.
    - Available Visualization Components: {{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

**Crucial Rules:**
- Focus ONLY on generating content for the lesson titled "{{{lessonTitle}}}". Do not generate content for any other lesson.
- Your component selections MUST come from the exact lists provided. Do not invent new components.
- **The choice of components MUST be directly relevant to the course topic: \`{{{courseTopic}}}\` and the lesson title: \`{{{lessonTitle}}}\`. For example, if the course topic is 'Sales Closing', DO NOT select a component related to Git like \`GitCommandSimulator\` or \`IssueTracker\`. Choose something more generic or relevant like \`AiHelper\` or \`ConceptDiagram\` only if it makes sense with the generated content.**
`,
  });

const generateLessonContentFlow = ai.defineFlow(
  {
    name: 'generateLessonContentFlow',
    inputSchema: GenerateLessonContentInputSchema,
    outputSchema: GenerateLessonContentOutputSchema,
  },
  async (input) => {
    const { output } = await generateLessonContentPrompt(input);
    return output!;
  }
);


export async function generateLessonContent(input: GenerateLessonContentInput): Promise<GenerateLessonContentOutput> {
  return generateLessonContentFlow(input);
}

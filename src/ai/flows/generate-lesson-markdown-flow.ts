
'use server';
/**
 * @fileOverview An AI flow for generating lesson Markdown content.
 *
 * - generateLessonMarkdown - A function that generates Markdown content for a lesson.
 * - GenerateLessonMarkdownInput - The input type for the function.
 * - GenerateLessonMarkdownOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonMarkdownInputSchema = z.object({
  lessonTitle: z.string().describe("The title of the lesson to generate."),
  lessonObjective: z.string().describe("The learning objective for the lesson."),
  courseTopic: z.string().describe("The main topic of the entire course for context."),
  targetAudience: z.string().describe("The target audience for the course."),
  courseLanguage: z.string().optional().describe("The language for the lesson content."),
  chapterContext: z.string().describe("The titles and objectives of other lessons in the same chapter to provide context and the full course plan to give global context."),
  lessonLength: z.enum(['Court', 'Moyen', 'Long']).optional().describe("The desired length for the lesson content. 'Court' for a summary, 'Moyen' for standard detail, 'Long' for an in-depth explanation."),
});
export type GenerateLessonMarkdownInput = z.infer<typeof GenerateLessonMarkdownInputSchema>;

const GenerateLessonMarkdownOutputSchema = z.object({
  illustrativeContent: z.string().describe("The main educational content for the lesson in well-structured Markdown format. It should include headings, lists, code blocks, and bold text to explain the concepts clearly."),
});
export type GenerateLessonMarkdownOutput = z.infer<typeof GenerateLessonMarkdownOutputSchema>;


const generateLessonMarkdownPrompt = ai.definePrompt({
    name: 'generateLessonMarkdownPrompt',
    input: { schema: GenerateLessonMarkdownInputSchema },
    output: { schema: GenerateLessonMarkdownOutputSchema },
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
Generate ONLY the **Illustrative Content (\`illustrativeContent\`)** for this single lesson.

- Write detailed, high-quality educational content in well-formatted Markdown. The length should correspond to the 'Desired Content Length' specified.
- The content MUST be directly related to the course topic: **{{{courseTopic}}}**.
- **The structure MUST be professional, clear, and highly readable.** Follow these formatting rules strictly:
    - Use Markdown headings (\`#\`, \`##\`, \`###\`) to create a clear hierarchy for titles and subtitles.
    - Use **bold** text (\`**text**\`) for key terms to make them stand out.
    - Use numbered lists (\`1.\`, \`2.\`, \`3.\`) or bulleted lists (\`*\`, \`-\`) for enumerations and lists of points.
    - Ensure proper punctuation and grammar throughout the text.
    - **Crucially, ensure there are double line breaks between paragraphs, lists, and headings to create clear visual separation and improve readability.**
- Write in a didactic and engaging tone. Avoid generic concluding paragraphs; focus on delivering rich, informative content from start to finish.
- DO NOT generate component names or any other fields. Your entire output must be the Markdown content for the lesson.
`,
  });

const generateLessonMarkdownFlow = ai.defineFlow(
  {
    name: 'generateLessonMarkdownFlow',
    inputSchema: GenerateLessonMarkdownInputSchema,
    outputSchema: GenerateLessonMarkdownOutputSchema,
  },
  async input => {
    const { output } = await generateLessonMarkdownPrompt(input);
    return output!;
  }
);

export async function generateLessonMarkdown(input: GenerateLessonMarkdownInput): Promise<GenerateLessonMarkdownOutput> {
  return generateLessonMarkdownFlow(input);
}

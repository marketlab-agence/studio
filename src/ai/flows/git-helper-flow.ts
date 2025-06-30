
'use server';
/**
 * @fileOverview An AI flow for providing contextual help on a given topic.
 *
 * - getGitHelp - A function that provides an explanation for a query related to a topic.
 * - GitHelperInput - The input type for the getGitHelp function.
 * - GitHelperOutput - The return type for the getGitHelp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GitHelperInputSchema = z.object({
  userInput: z.string().describe('The user\'s question or the concept they are asking about.'),
  lessonContext: z.string().describe('The title of the lesson the user is currently on, to provide context.'),
  courseTopic: z.string().describe('The general topic of the course, to define the expert persona.'),
  responseLength: z.enum(['Court', 'Moyen', 'Long']).describe("The desired length for the AI's response."),
});
export type GitHelperInput = z.infer<typeof GitHelperInputSchema>;

const GitHelperOutputSchema = z.object({
  explanation: z.string().describe("A helpful explanation, tip, or example in Markdown format. The explanation should be clear, concise, and tailored to a student."),
});
export type GitHelperOutput = z.infer<typeof GitHelperOutputSchema>;

export async function getGitHelp(input: GitHelperInput): Promise<GitHelperOutput> {
  return gitHelperFlow(input);
}

const prompt = ai.definePrompt({
  name: 'gitHelperPrompt',
  input: {schema: GitHelperInputSchema},
  output: {schema: GitHelperOutputSchema},
  prompt: `You are a friendly and expert instructor, acting as an AI assistant called "Katalyst AI". Your area of expertise is "{{courseTopic}}".
A student is working through an interactive tutorial. They are currently on the lesson titled "{{lessonContext}}".

The student's query is:
"{{userInput}}"

Your task is to provide a helpful and encouraging explanation about "{{courseTopic}}".
- **First, detect the language of the user's query. Your entire response MUST be in that same language. If you cannot detect the language, default to French.**
- If it's a question, answer it clearly in the context of "{{courseTopic}}".
- If it's a concept, explain what it means, its implications, and provide a best-practice example relevant to "{{courseTopic}}".
- If it's an incorrect concept, gently correct it and explain the mistake.
- Always keep the student's learning context ("{{lessonContext}}") in mind.
- Format your response using Markdown. Use code blocks for commands or examples where appropriate.
- Keep your tone supportive and act as a co-pilot for their learning journey.
- **Adhere to the requested response length: {{{responseLength}}}.**
  - 'Court': A one or two-sentence summary.
  - 'Moyen': A couple of paragraphs.
  - 'Long': A detailed explanation with examples.
`,
});

const gitHelperFlow = ai.defineFlow(
  {
    name: 'gitHelperFlow',
    inputSchema: GitHelperInputSchema,
    outputSchema: GitHelperOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

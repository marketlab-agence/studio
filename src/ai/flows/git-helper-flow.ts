'use server';
/**
 * @fileOverview An AI flow for providing contextual Git help.
 *
 * - getGitHelp - A function that provides an explanation for a Git-related query.
 * - GitHelperInput - The input type for the getGitHelp function.
 * - GitHelperOutput - The return type for the getGitHelp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GitHelperInputSchema = z.object({
  userInput: z.string().describe('The user\'s question or the Git command they are asking about.'),
  lessonContext: z.string().describe('The title of the lesson the user is currently on, to provide context.'),
});
export type GitHelperInput = z.infer<typeof GitHelperInputSchema>;

const GitHelperOutputSchema = z.object({
  explanation: z.string().describe("A helpful explanation, tip, or corrected command in Markdown format. The explanation should be clear, concise, and tailored to a student."),
});
export type GitHelperOutput = z.infer<typeof GitHelperOutputSchema>;

export async function getGitHelp(input: GitHelperInput): Promise<GitHelperOutput> {
  return gitHelperFlow(input);
}

const prompt = ai.definePrompt({
  name: 'gitHelperPrompt',
  input: {schema: GitHelperInputSchema},
  output: {schema: GitHelperOutputSchema},
  prompt: `You are a friendly and expert Git instructor, acting as an AI assistant called "Katalyst AI".
A student is working through an interactive tutorial. They are currently on the lesson titled "{{lessonContext}}".

The student's query is:
"{{userInput}}"

Your task is to provide a helpful and encouraging explanation.
- If it's a question, answer it clearly.
- If it's a Git command, explain what it does, its common options, and provide a best-practice example.
- If it's an incorrect command, gently correct it and explain the mistake.
- Always keep the student's learning context ("{{lessonContext}}") in mind.
- Format your response using Markdown. Use code blocks for commands.
- Keep your tone supportive and act as a co-pilot for their learning journey.
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

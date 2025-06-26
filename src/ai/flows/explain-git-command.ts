'use server';

/**
 * @fileOverview An AI agent that explains Git commands based on the current tutorial context.
 *
 * - explainGitCommand - A function that explains a given Git command.
 * - ExplainGitCommandInput - The input type for the explainGitCommand function.
 * - ExplainGitCommandOutput - The return type for the explainGitCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainGitCommandInputSchema = z.object({
  command: z.string().describe('The Git command to explain.'),
  context: z.string().describe('The current tutorial context or user state.'),
});
export type ExplainGitCommandInput = z.infer<typeof ExplainGitCommandInputSchema>;

const ExplainGitCommandOutputSchema = z.object({
  explanation: z.string().describe('A detailed explanation of the Git command in the given context.'),
});
export type ExplainGitCommandOutput = z.infer<typeof ExplainGitCommandOutputSchema>;

export async function explainGitCommand(input: ExplainGitCommandInput): Promise<ExplainGitCommandOutput> {
  return explainGitCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainGitCommandPrompt',
  input: {schema: ExplainGitCommandInputSchema},
  output: {schema: ExplainGitCommandOutputSchema},
  prompt: `You are an expert Git instructor. A student has entered the following Git command:

  {{command}}

  The student is currently in this context or tutorial state:

  {{context}}

  Explain what the command does, tailored to the current tutorial context, so the student can understand its function and usage in this situation.`,
});

const explainGitCommandFlow = ai.defineFlow(
  {
    name: 'explainGitCommandFlow',
    inputSchema: ExplainGitCommandInputSchema,
    outputSchema: ExplainGitCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

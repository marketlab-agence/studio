'use server';

/**
 * @fileOverview Un agent IA qui explique les commandes Git en fonction du contexte du tutoriel actuel.
 *
 * - explainGitCommand - Une fonction qui explique une commande Git donnée.
 * - ExplainGitCommandInput - Le type d'entrée pour la fonction explainGitCommand.
 * - ExplainGitCommandOutput - Le type de retour pour la fonction explainGitCommand.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainGitCommandInputSchema = z.object({
  command: z.string().describe('La commande Git à expliquer.'),
  context: z.string().describe('Le contexte actuel du tutoriel ou l\'état de l\'utilisateur.'),
});
export type ExplainGitCommandInput = z.infer<typeof ExplainGitCommandInputSchema>;

const ExplainGitCommandOutputSchema = z.object({
  explanation: z.string().describe('Une explication détaillée de la commande Git dans le contexte donné.'),
});
export type ExplainGitCommandOutput = z.infer<typeof ExplainGitCommandOutputSchema>;

export async function explainGitCommand(input: ExplainGitCommandInput): Promise<ExplainGitCommandOutput> {
  return explainGitCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainGitCommandPrompt',
  input: {schema: ExplainGitCommandInputSchema},
  output: {schema: ExplainGitCommandOutputSchema},
  prompt: `Vous êtes un instructeur Git expert. Un étudiant a entré la commande Git suivante :

  {{command}}

  L'étudiant se trouve actuellement dans ce contexte ou état de tutoriel :

  {{context}}

  Expliquez ce que fait la commande, en l'adaptant au contexte actuel du tutoriel, afin que l'étudiant puisse comprendre sa fonction et son utilisation dans cette situation.`,
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

'use server';

import { explainGitCommand } from '@/ai/flows/explain-git-command';

export async function explainCommand(command: string, context: string) {
  try {
    const { explanation } = await explainGitCommand({ command, context });
    return { explanation };
  } catch (error) {
    console.error('Erreur lors de l\'appel du flux Genkit :', error);
    return {
      explanation: 'Désolé, j\'ai rencontré une erreur en essayant d\'expliquer cette commande.',
    };
  }
}

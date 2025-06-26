'use server';

import { explainGitCommand } from '@/ai/flows/explain-git-command';

const MOCK_FILESYSTEM = [
  '.git/',
  'src/',
  'public/',
  '.gitignore',
  'package.json',
  'README.md'
];

const MOCK_GIT_STATUS_CLEAN = `Sur la branche main
Votre branche est à jour avec 'origin/main'.

rien à valider, l'arbre de travail est propre`;

const MOCK_GIT_STATUS_UNTRACKED = `Sur la branche main
Votre branche est à jour avec 'origin/main'.

Fichiers non suivis :
  (utilisez "git add <fichier>..." pour inclure dans ce qui sera validé)
	new-file.txt

rien ajouté à la validation mais des fichiers non suivis sont présents (utilisez "git add" pour les suivre)`;


export async function explainCommand(command: string, context: string) {
  let mockOutput: string | null = null;
  
  if (command.trim() === 'ls') {
    mockOutput = MOCK_FILESYSTEM.join('\n');
  }

  if (command.trim() === 'git status') {
    mockOutput = MOCK_GIT_STATUS_CLEAN;
  }
  
  if (command.trim() === 'touch new-file.txt') {
    mockOutput = '';
  }

  if (command.startsWith('git add')) {
    mockOutput = ``;
  }

  if (command.trim() === 'git log') {
    mockOutput = `commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0 (HEAD -> main)
Auteur : Vous <vous@example.com>
Date:   lun. oct. 28 14:30:00 2024 -0400

    Commit initial
`
  }
  
  try {
    const { explanation } = await explainGitCommand({ command, context });
    return { explanation, output: mockOutput };
  } catch (error) {
    console.error('Erreur lors de l\'appel du flux Genkit :', error);
    return {
      explanation: 'Désolé, j\'ai rencontré une erreur en essayant d\'expliquer cette commande.',
      output: mockOutput,
    };
  }
}

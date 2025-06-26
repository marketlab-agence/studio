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

const MOCK_GIT_STATUS_CLEAN = `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;

const MOCK_GIT_STATUS_UNTRACKED = `On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	new-file.txt

nothing added to commit but untracked files present (use "git add" to track)`;


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
Author: You <you@example.com>
Date:   Mon Oct 28 14:30:00 2024 -0400

    Initial commit
`
  }
  
  try {
    const { explanation } = await explainGitCommand({ command, context });
    return { explanation, output: mockOutput };
  } catch (error) {
    console.error('Error calling Genkit flow:', error);
    return {
      explanation: 'Sorry, I encountered an error while trying to explain that command.',
      output: mockOutput,
    };
  }
}

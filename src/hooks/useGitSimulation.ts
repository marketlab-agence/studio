import { useState } from 'react';

// Ceci est un placeholder. Un vrai simulateur serait plus complexe.
type GitState = {
  initialized: boolean;
  stagedFiles: string[];
  commits: object[];
  currentBranch: string;
};

const initialState: GitState = {
  initialized: false,
  stagedFiles: [],
  commits: [],
  currentBranch: 'main',
};

/**
 * Hook pour gérer l'état d'une simulation Git.
 */
export function useGitSimulation() {
  const [state, setState] = useState<GitState>(initialState);

  const runCommand = (command: string, args: string[]): string => {
    // Placeholder pour la logique de commande
    if (command === 'init') {
      setState({ ...initialState, initialized: true });
      return 'Dépôt Git vide initialisé.';
    }
    return `Commande '${command}' non reconnue.`;
  };

  return { state, runCommand };
}

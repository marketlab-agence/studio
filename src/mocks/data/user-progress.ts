import type { UserProgress } from '@/types/tutorial.types';

/**
 * Données de test pour la progression de l'utilisateur.
 */
export const mockUserProgress: UserProgress = {
  completedSteps: new Set(['1-1']),
  currentStepId: '1-2',
};

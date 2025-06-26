import { type UserProgress } from '@/types/tutorial.types';

/**
 * Utilitaires pour le suivi de la progression de l'utilisateur.
 */

export function calculateProgress(progress: UserProgress, totalSteps: number): number {
  if (totalSteps === 0) return 0;
  return (progress.completedSteps.size / totalSteps) * 100;
}

export function isStepCompleted(progress: UserProgress, stepId: string): boolean {
  return progress.completedSteps.has(stepId);
}

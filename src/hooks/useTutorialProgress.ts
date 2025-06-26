import { useState, useCallback } from 'react';

/**
 * Hook pour gérer la progression globale du tutoriel.
 */
export function useTutorialProgress(totalSteps: number) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;

  const completeStep = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.add(stepId);
      return newSet;
    });
  }, []);

  return { progress, completedSteps, completeStep };
}

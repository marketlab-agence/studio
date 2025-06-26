import { calculateProgress, isStepCompleted } from '@/utils/progress-tracking';
import type { UserProgress } from '@/types/tutorial.types';

describe('Utilitaires de suivi de progression', () => {
  const progress: UserProgress = {
    completedSteps: new Set(['step1', 'step3']),
    currentStepId: 'step4',
  };
  const totalSteps = 10;

  test('calculateProgress devrait calculer le pourcentage correct', () => {
    const percentage = calculateProgress(progress, totalSteps);
    expect(percentage).toBe(20);
  });

  test('isStepCompleted devrait retourner true pour une étape complétée', () => {
    expect(isStepCompleted(progress, 'step1')).toBe(true);
  });

  test('isStepCompleted devrait retourner false pour une étape non complétée', () => {
    expect(isStepCompleted(progress, 'step2')).toBe(false);
  });
});

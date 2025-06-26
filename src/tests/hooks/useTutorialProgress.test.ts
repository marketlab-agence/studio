import { renderHook, act } from '@testing-library/react';
import { useTutorialProgress } from '@/hooks/useTutorialProgress';

describe('useTutorialProgress', () => {
  test('devrait calculer correctement la progression initiale', () => {
    const { result } = renderHook(() => useTutorialProgress(10));
    expect(result.current.progress).toBe(0);
    expect(result.current.completedSteps.size).toBe(0);
  });

  test('devrait mettre à jour la progression lors de la complétion d\'une étape', () => {
    const { result } = renderHook(() => useTutorialProgress(10));

    act(() => {
      result.current.completeStep('step-1');
    });

    expect(result.current.progress).toBe(10);
    expect(result.current.completedSteps.has('step-1')).toBe(true);
  });

  test('ne devrait pas ajouter de doublons', () => {
    const { result } = renderHook(() => useTutorialProgress(10));

    act(() => {
      result.current.completeStep('step-1');
      result.current.completeStep('step-1');
    });

    expect(result.current.progress).toBe(10);
    expect(result.current.completedSteps.size).toBe(1);
  });
});

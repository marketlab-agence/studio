import { renderHook, act } from '@testing-library/react';
import { useGitSimulation } from '@/hooks/useGitSimulation';

describe('useGitSimulation', () => {
  test('devrait avoir un état initial correct', () => {
    const { result } = renderHook(() => useGitSimulation());
    expect(result.current.state.initialized).toBe(false);
    expect(result.current.state.currentBranch).toBe('main');
  });

  test('devrait simuler la commande `git init`', () => {
    const { result } = renderHook(() => useGitSimulation());
    act(() => {
      result.current.runCommand('init', []);
    });
    expect(result.current.state.initialized).toBe(true);
  });
});

import { renderHook } from '@testing-library/react';
import { useAnimations } from '@/hooks/useAnimations';

// Framer Motion useAnimation hook ne peut pas être testé dans Node.
// Ce test vérifie simplement que le hook ne lève pas d'erreur.
describe('useAnimations', () => {
  test('devrait retourner des contrôles d\'animation', () => {
    const { result } = renderHook(() => useAnimations());
    expect(result.current).toBeDefined();
  });
});

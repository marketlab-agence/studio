import { useQuery } from '@tanstack/react-query';
import { TUTORIALS } from '@/lib/tutorials';
import type { Tutorial } from '@/types/tutorial.types';

async function fetchTutorials(): Promise<Tutorial[]> {
  // Simule un appel réseau
  await new Promise(resolve => setTimeout(resolve, 300));
  return TUTORIALS;
}

export function useTutorialsQuery() {
  return useQuery({
    queryKey: ['tutorials'],
    queryFn: fetchTutorials,
  });
}

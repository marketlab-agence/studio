import { useQuery } from '@tanstack/react-query';
import type { Tutorial } from '@/types/tutorial.types';

async function fetchTutorials(): Promise<Tutorial[]> {
  const response = await fetch('/api/tutorials');
  if (!response.ok) throw new Error('Échec de la récupération des tutoriels');
  return response.json();
}

export function useTutorialsQuery() {
  return useQuery({
    queryKey: ['tutorials'],
    queryFn: fetchTutorials,
  });
}

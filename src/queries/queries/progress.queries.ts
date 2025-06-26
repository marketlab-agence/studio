import { useQuery } from '@tanstack/react-query';
import type { UserProgress } from '@/types/tutorial.types';

async function fetchUserProgress(): Promise<UserProgress> {
  // Simule la récupération de la progression depuis le localStorage ou une API
  await new Promise(resolve => setTimeout(resolve, 200));
  const savedProgress = localStorage.getItem('user-progress');
  if (savedProgress) {
    const data = JSON.parse(savedProgress);
    // Assurez-vous que completedSteps est un Set
    data.completedSteps = new Set(data.completedSteps);
    return data;
  }
  return {
    completedSteps: new Set(),
    currentStepId: null,
  };
}

export function useUserProgressQuery() {
  return useQuery({
    queryKey: ['userProgress'],
    queryFn: fetchUserProgress,
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProgress } from '@/types/tutorial.types';

async function saveUserProgress(progress: UserProgress): Promise<UserProgress> {
  // Simule la sauvegarde de la progression
  await new Promise(resolve => setTimeout(resolve, 200));
  // Convertir le Set en Array pour la sérialisation JSON
  const serializableProgress = {
    ...progress,
    completedSteps: Array.from(progress.completedSteps),
  };
  localStorage.setItem('user-progress', JSON.stringify(serializableProgress));
  return progress;
}

export function useSaveUserProgressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveUserProgress,
    onSuccess: (data) => {
      // Invalider et refetch la requête de progression pour garder les données à jour
      queryClient.setQueryData(['userProgress'], data);
    },
  });
}

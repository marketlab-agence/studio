import { useMutation, useQueryClient } from '@tanstack/react-query';

type UserSettings = {
  theme: 'light' | 'dark';
};

async function saveUserSettings(settings: UserSettings): Promise<UserSettings> {
  // Simule la sauvegarde des paramètres
  await new Promise(resolve => setTimeout(resolve, 100));
  localStorage.setItem('user-settings', JSON.stringify(settings));
  return settings;
}

export function useSaveSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveUserSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
}

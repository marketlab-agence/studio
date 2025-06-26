import { useMutation } from '@tanstack/react-query';

type CompletionData = {
  userName: string;
  completionDate: string;
};

// Simule la soumission des données pour la génération d'un certificat
async function submitForCertificate(data: CompletionData): Promise<{ certificateUrl: string }> {
  console.log('Submitting for certificate:', data);
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Retourne une URL de certificat factice
  return { certificateUrl: `/api/certificate?user=${data.userName}` };
}

export function useCompletionMutation() {
  return useMutation({
    mutationFn: submitForCertificate,
  });
}

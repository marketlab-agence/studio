import { useQuery } from '@tanstack/react-query';

// Fichier pour les requêtes vers l'API GitHub (si nécessaire)

type GitHubRepo = {
  id: number;
  name: string;
  stargazers_count: number;
};

async function fetchRepoData(repoName: string): Promise<GitHubRepo> {
  const response = await fetch(`https://api.github.com/repos/${repoName}`);
  if (!response.ok) {
    throw new Error('Failed to fetch repo data from GitHub');
  }
  return response.json();
}

export function useGitHubRepoQuery(repoName: string) {
  return useQuery({
    queryKey: ['githubRepo', repoName],
    queryFn: () => fetchRepoData(repoName),
    enabled: !!repoName, // Ne lance la requête que si repoName est fourni
  });
}

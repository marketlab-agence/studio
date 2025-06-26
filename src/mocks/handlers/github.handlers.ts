import { http, HttpResponse } from 'msw';

/**
 * Gestionnaires de requêtes MSW pour l'API GitHub.
 */
export const githubHandlers = [
  http.get('https://api.github.com/repos/facebook/react', (req) => {
    return HttpResponse.json({
      id: 10270250,
      name: 'react',
      stargazers_count: 210000,
    });
  }),
];

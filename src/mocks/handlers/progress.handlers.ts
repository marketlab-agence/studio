import { http, HttpResponse } from 'msw';
import { mockUserProgress } from '../data/user-progress';

/**
 * Gestionnaires de requêtes MSW pour la progression de l'utilisateur.
 */
export const progressHandlers = [
  http.get('/api/progress', (req) => {
    return HttpResponse.json(mockUserProgress);
  }),
  http.post('/api/progress', async ({ request }) => {
    const data = await request.json();
    console.log('Progression sauvegardée (mock):', data);
    return HttpResponse.json(data, { status: 200 });
  }),
];

import { http, HttpResponse } from 'msw';
import { mockTutorials } from '../data/tutorial-data';

/**
 * Gestionnaires de requêtes MSW pour le tutoriel.
 */
export const tutorialHandlers = [
  http.get('/api/tutorials', (req) => {
    return HttpResponse.json(mockTutorials);
  }),
];

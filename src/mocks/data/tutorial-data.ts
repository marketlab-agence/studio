/**
 * Données de test pour le contenu du tutoriel.
 */
import type { Tutorial } from '@/types/tutorial.types';

export const mockTutorials: Tutorial[] = [
  {
    id: 'mock-intro',
    courseId: 'mock-course',
    title: 'Introduction (Mock)',
    description: 'Ceci est une description de test.',
    lessons: [
      {
        id: 'mock-1-1',
        title: 'Première Étape de Test',
        objective: 'Découvrir le contenu de démonstration.',
        content: 'Contenu de la première étape.',
      },
    ],
  },
];

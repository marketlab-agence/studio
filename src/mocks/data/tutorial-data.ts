/**
 * Données de test pour le contenu du tutoriel.
 */
import type { Tutorial } from '@/types/tutorial.types';

export const mockTutorials: Tutorial[] = [
  {
    id: 'mock-intro',
    title: 'Introduction (Mock)',
    description: 'Ceci est une description de test.',
    steps: [
      {
        id: 'mock-1-1',
        title: 'Première Étape de Test',
        content: 'Contenu de la première étape.',
        command: 'echo "test"',
      },
    ],
  },
];

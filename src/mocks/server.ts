import { setupServer } from 'msw/node';
import { githubHandlers } from './handlers/github.handlers';
import { progressHandlers } from './handlers/progress.handlers';
import { tutorialHandlers } from './handlers/tutorial.handlers';

// Combine tous les gestionnaires
const allHandlers = [...githubHandlers, ...progressHandlers, ...tutorialHandlers];

// Configure un serveur de requêtes de test avec les gestionnaires donnés.
export const server = setupServer(...allHandlers);

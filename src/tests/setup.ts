import '@testing-library/jest-dom';
import { server } from '../mocks/server';

// Établir les mocks d'API avant tous les tests.
beforeAll(() => server.listen());

// Réinitialiser les gestionnaires de requêtes après chaque test pour qu'ils n'affectent pas les autres tests.
afterEach(() => server.resetHandlers());

// Nettoyer après que les tests soient terminés.
afterAll(() => server.close());

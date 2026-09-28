import '@testing-library/jest-dom';
import { server } from '../mocks/server';

// jsdom n'implémente pas `ResizeObserver`, requis par les primitives Radix (Slider, etc.).
// Sans ce stub, tout rendu de composant utilisant un `Slider` échoue à l'exécution du test.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Établir les mocks d'API avant tous les tests.
beforeAll(() => server.listen());

// Réinitialiser les gestionnaires de requêtes après chaque test pour qu'ils n'affectent pas les autres tests.
afterEach(() => server.resetHandlers());

// Nettoyer après que les tests soient terminés.
afterAll(() => server.close());

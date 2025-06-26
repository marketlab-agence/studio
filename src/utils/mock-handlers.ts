/**
 * Ce fichier contiendrait des gestionnaires de requêtes pour Mock Service Worker (MSW).
 * Utile pour mocker les appels API dans les tests.
 *
 * Exemple avec la bibliothèque 'msw':
 *
 * import { rest } from 'msw';
 *
 * export const handlers = [
 *   rest.get('/api/user', (req, res, ctx) => {
 *     return res(
 *       ctx.status(200),
 *       ctx.json({ username: 'test-user' })
 *     );
 *   }),
 * ];
 */

export const handlers = []; // Exporter un tableau vide pour l'instant.

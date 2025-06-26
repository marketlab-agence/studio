/**
 * Données de test pour les dépôts Git.
 */
export const mockRepository = {
  id: 12345,
  name: 'mon-super-projet',
  files: ['README.md', 'package.json', 'src/index.js'],
  commits: [
    { id: 'c1', message: 'Commit initial' },
    { id: 'c2', message: 'Ajout de la fonctionnalité principale' },
  ],
};

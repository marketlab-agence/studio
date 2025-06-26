import { simulateGitInit, simulateGitStatus } from '@/utils/git-commands';

describe('Utilitaires de commandes Git', () => {
  test('simulateGitInit devrait retourner un message de succès', () => {
    // Espionner console.log pour éviter le bruit dans les tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = simulateGitInit();
    expect(result).toContain('Dépôt Git vide initialisé');
    consoleSpy.mockRestore();
  });

  test('simulateGitStatus devrait retourner un statut propre', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = simulateGitStatus();
    expect(result).toContain("l'arbre de travail est propre");
    consoleSpy.mockRestore();
  });
});

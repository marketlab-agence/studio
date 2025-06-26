/**
 * Fichier d'utilitaires pour simuler des commandes Git.
 * Ces fonctions retourneraient des modifications d'un état simulé de dépôt Git.
 */

export function simulateGitInit(): string {
  console.log('Simulating: git init');
  return 'Dépôt Git vide initialisé dans .git/';
}

export function simulateGitStatus(): string {
  console.log('Simulating: git status');
  return "Sur la branche main\nVotre branche est à jour avec 'origin/main'.\n\nrien à valider, l'arbre de travail est propre";
}

export function simulateGitAdd(files: string[]): string {
  console.log(`Simulating: git add ${files.join(' ')}`);
  return ''; // git add ne produit pas de sortie en cas de succès
}

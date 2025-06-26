/**
 * Utilitaires pour la validation des entrées utilisateur.
 */

export function isValidBranchName(name: string): boolean {
  if (!name || name.length === 0) return false;
  // Logique de validation simple. Une vraie implémentation serait plus robuste.
  if (name.includes(' ') || name.includes('..')) return false;
  return true;
}

export function isValidEmail(email: string): boolean {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

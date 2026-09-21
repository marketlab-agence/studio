/**
 * Garde-fou contre la **redirection ouverte**.
 *
 * Après connexion, l'application renvoie l'utilisateur vers la page qu'il
 * demandait (`?redirect=/admin/courses`). Si cette valeur est utilisée telle
 * quelle, un lien forgé (`?redirect=https://exemple-malveillant.test`) permet de
 * faire aboutir une connexion **réelle** sur un site tiers — un vecteur de
 * hameçonnage très convaincant, puisque l'utilisateur vient de saisir ses
 * identifiants sur le bon domaine.
 *
 * Seuls les chemins **internes** sont donc acceptés.
 */

/** Chemin de repli lorsque la destination demandée n'est pas utilisable. */
export const DEFAULT_REDIRECT = '/dashboard';

export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!candidate) return fallback;

  const trimmed = candidate.trim();

  // Un chemin interne commence par « / » mais pas par « // » : « //exemple.test »
  // est interprété par les navigateurs comme une URL absolue (URL relative au
  // protocole). C'est le contournement le plus courant.
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;

  // Un antislash est normalisé en « / » par certains navigateurs : « /\exemple »
  // deviendrait « //exemple », donc une URL absolue.
  if (trimmed.includes('\\')) return fallback;

  // Retour à la ligne ou caractère de contrôle : tentative d'injection d'en-tête.
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return fallback;

  return trimmed;
}

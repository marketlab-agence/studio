/**
 * URL publique de l'application, utilisée pour construire les liens envoyés par
 * email (réinitialisation de mot de passe, invitations).
 *
 * Un lien erroné dans un email est difficile à diagnostiquer : l'utilisateur
 * reçoit le message, clique, et rien ne se passe. On refuse donc explicitement
 * l'absence de configuration en production plutôt que d'envoyer un lien vers
 * `localhost`.
 */
export function appUrl(): string {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (configured) return configured.replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'APP_URL est absent : impossible de construire un lien fiable dans un email ' +
        'en production (le repli pointerait vers localhost).',
    );
  }

  return 'http://localhost:3000';
}

/** Construit un lien absolu à partir d'un chemin interne. */
export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${appUrl()}${suffix}`;
}

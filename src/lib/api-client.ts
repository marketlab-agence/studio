/**
 * Client HTTP de l'application.
 *
 * Extrait de `@/lib/auth/client` : le même besoin (appeler l'API, normaliser les
 * erreurs, ne jamais lever) sert à l'authentification **et** à la progression.
 * Le dupliquer ferait diverger les deux sur des points sensibles — gestion du
 * 204, des pannes réseau, des motifs de validation.
 *
 * Aucune fonction de ce module ne manipule de jeton : les cookies de session sont
 * `httpOnly`, donc invisibles au JavaScript de la page.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      /** Motifs de rejet renvoyés par la validation Zod du serveur. */
      issues?: { champ: string; message: string }[];
    };

export async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      // `same-origin` : les cookies ne partent jamais vers un domaine tiers.
      credentials: 'same-origin',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });

    // 204 : succès sans contenu (déconnexion, suppression).
    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: payload?.message ?? 'La demande n’a pas pu aboutir.',
        issues: payload?.issues,
      };
    }

    return { ok: true, data: payload as T };
  } catch {
    // Panne réseau : distincte d'un refus du serveur. L'utilisateur doit le
    // savoir — réessayer a du sens dans ce cas, pas dans l'autre.
    return {
      ok: false,
      status: 0,
      message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    };
  }
}

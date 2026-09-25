import { NextResponse } from 'next/server';
import { getAuthProvider, isMfaChallenge } from '@/lib/providers';
import { loginSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody } from '@/lib/auth/api';
import { setSessionCookies } from '@/lib/auth/cookies';

/**
 * Nom du cookie de locale posé par `next-intl` (valeur par défaut de la librairie).
 * Il est redéfini à la connexion pour que la préférence en base fasse foi.
 */
const NEXT_LOCALE_COOKIE = 'NEXT_LOCALE';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/login — connexion (REQ-AUTH-01, REQ-AUTH-04, REQ-AUTH-06).
 *
 * Deux issues possibles :
 *
 * 1. **Session complète** — cookies posés, comme attendu.
 * 2. **Second facteur exigé** (`mfaRequired`) — dans ce cas **aucun cookie n'est
 *    posé** : le mot de passe seul ne suffit pas. Le client doit présenter le
 *    défi et le code TOTP sur `/api/auth/mfa/challenge`.
 *
 * Réponse identique pour un email inconnu et un mot de passe erroné : le
 * provider garantit déjà l'égalité du message et du type d'erreur, et cette
 * route se contente de la relayer sans l'enrichir.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'login', RATE_LIMITS.login);
  if (limited) return limited;

  const body = await parseBody(request, loginSchema);
  if (body.response) return body.response;

  try {
    const result = await getAuthProvider().login(body.data);

    if (isMfaChallenge(result)) {
      return NextResponse.json(
        {
          mfaRequired: true,
          challengeToken: result.challengeToken,
          expiresInSeconds: result.expiresInSeconds,
        },
        { status: 200 },
      );
    }

      const reponse = setSessionCookies(
        NextResponse.json({
          user: result.user,
          accessTokenExpiresIn: result.accessTokenExpiresIn,
          // Indique au client où rediriger : changement de mot de passe imposé.
          redirectTo: result.user.mustResetPassword ? '/forgot-password' : null,
        }),
        result,
      );

      /**
       * La préférence de langue stockée en base **prime** sur le cookie du navigateur.
       *
       * ⚠️ **Pourquoi ici, et pas dans le middleware.** L'ordre de priorité est
       * « base > cookie > défaut », mais lire la base exigerait un accès PostgreSQL
       * — impossible dans le middleware, qui tourne en runtime Edge. La connexion
       * est le seul moment où les deux sont accessibles : c'est donc ici qu'on
       * réaligne le cookie sur la valeur durable.
       *
       * Conséquence voulue : un formateur qui se connecte depuis un autre poste
       * retrouve sa langue, au lieu de subir celle du navigateur.
       */
      if (result.user.language) {
        reponse.cookies.set(NEXT_LOCALE_COOKIE, result.user.language, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        });
      }

      return reponse;
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/login');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}

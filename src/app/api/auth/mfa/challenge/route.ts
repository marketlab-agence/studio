import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { mfaChallengeSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody } from '@/lib/auth/api';
import { setSessionCookies } from '@/lib/auth/cookies';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/mfa/challenge — complète une connexion à deux facteurs.
 *
 * **Aucune session n'est exigée** : c'est précisément cette route qui l'ouvre.
 * Elle s'authentifie par le **défi** retourné par `/api/auth/login`, qui atteste
 * que le mot de passe a déjà été vérifié.
 *
 * Le défi et le code sont exigés ensemble : ni l'un ni l'autre ne suffit, ce qui
 * évite qu'un défi intercepté ne serve à lui seul.
 *
 * Limite de débit stricte : le code fait 6 chiffres, donc 10^6 possibilités.
 * Sans limitation, la seconde authentification serait contournable par force
 * brute — c'est-à-dire inutile.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'mfa-challenge', RATE_LIMITS.login);
  if (limited) return limited;

  const body = await parseBody(request, mfaChallengeSchema);
  if (body.response) return body.response;

  try {
    const session = await getAuthProvider().completeMfaChallenge(
      body.data.challengeToken,
      body.data.code,
    );

    return setSessionCookies(
      NextResponse.json({
        user: session.user,
        accessTokenExpiresIn: session.accessTokenExpiresIn,
      }),
      session,
    );
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/mfa/challenge');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}

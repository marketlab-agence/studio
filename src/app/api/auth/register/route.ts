import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { registerSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody } from '@/lib/auth/api';
import { setSessionCookies } from '@/lib/auth/cookies';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/register — création de compte (REQ-AUTH-01, REQ-ORG-04).
 *
 * Sans `organizationId`, l'inscription crée une organisation et l'inscrit en
 * devient Propriétaire : c'est l'inscription libre-service.
 *
 * Le corps accepte un champ optionnel `organizationId` (rejoindre une
 * organisation existante, réservé aux invitations — phase 4, T4.13).
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'register', RATE_LIMITS.register);
  if (limited) return limited;

  const body = await parseBody(request, registerSchema);
  if (body.response) return body.response;

  try {
    const session = await getAuthProvider().register(body.data);

    // Le mot de passe n'est jamais renvoyé, ni en clair ni haché.
    return setSessionCookies(
      NextResponse.json(
        {
          user: session.user,
          accessTokenExpiresIn: session.accessTokenExpiresIn,
        },
        { status: 201 },
      ),
      session,
    );
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/register');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}

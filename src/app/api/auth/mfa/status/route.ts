import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { errorResponse, mapAuthError, requireSession, scopeFromClaims } from '@/lib/auth/api';

/**
 * GET /api/auth/mfa/status — état de la double authentification.
 *
 * `configured` et `enabled` sont **distincts** : un secret peut exister sans que
 * la double authentification soit active (voir `beginMfaSetup`). Confondre les
 * deux ferait croire à une protection qui n'est pas encore en place.
 */
export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  try {
    const status = await getAuthProvider().mfaStatus(
      scopeFromClaims(session.claims),
      session.claims.userId,
    );

    return NextResponse.json(status);
  } catch (error) {
    return mapAuthError(error, 'GET /api/auth/mfa/status');
  }
}

export async function POST() {
  return errorResponse('Méthode non autorisée : l’activation passe par /api/auth/mfa/setup.', 405);
}

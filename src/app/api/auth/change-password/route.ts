import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { changePasswordSchema } from '@/lib/schemas/auth';
import {
  enforceRateLimit,
  errorResponse,
  mapAuthError,
  parseBody,
  requireSession,
  scopeFromClaims,
} from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/change-password — changement par un utilisateur connecté.
 *
 * Le **mot de passe actuel est exigé** (le provider s'en charge) : sans cela, un
 * jeton d'accès volé suffirait à s'approprier définitivement le compte.
 *
 * Les autres sessions ne sont **pas** révoquées ici : changer volontairement son
 * mot de passe ne doit pas déconnecter ses autres appareils. Une
 * réinitialisation par lien, elle, les révoque toutes — la situation n'est pas
 * la même.
 */
export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  const limited = enforceRateLimit(request, 'change-password', RATE_LIMITS.login);
  if (limited) return limited;

  const body = await parseBody(request, changePasswordSchema);
  if (body.response) return body.response;

  try {
    await getAuthProvider().changePassword(
      scopeFromClaims(session.claims),
      session.claims.userId,
      body.data.currentPassword,
      body.data.newPassword,
    );

    return NextResponse.json({ message: 'Votre mot de passe a été modifié.' });
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/change-password');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}

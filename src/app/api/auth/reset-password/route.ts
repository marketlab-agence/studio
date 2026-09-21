import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { resetPasswordSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody } from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/auth/reset-password — définition d'un nouveau mot de passe.
 *
 * Le jeton provient du lien reçu par email. Il est **à usage unique** et
 * consommé dans la même transaction que le changement de mot de passe (voir
 * `JwtAuthProvider.resetPassword`).
 *
 * Aucune session n'est ouverte au passage : l'utilisateur se connecte ensuite
 * avec son nouveau mot de passe. Ouvrir une session ici ferait d'un lien
 * d'email une authentification complète — ce qu'un lien intercepté ne doit
 * jamais permettre.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'reset-password', RATE_LIMITS.resetPassword);
  if (limited) return limited;

  const body = await parseBody(request, resetPasswordSchema);
  if (body.response) return body.response;

  try {
    await getAuthProvider().resetPassword(body.data.token, body.data.password);

    return NextResponse.json({
      message: 'Votre mot de passe a été défini. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/reset-password');
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}

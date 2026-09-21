import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthProvider, getUserProvider } from '@/lib/providers';
import {
  errorResponse,
  mapAuthError,
  parseBody,
  requireSession,
  scopeFromClaims,
} from '@/lib/auth/api';

/**
 * GET   /api/auth/me — utilisateur de la session courante.
 * PATCH /api/auth/me — met à jour le profil de l'utilisateur connecté.
 *
 * Le `GET` sert à **amorcer** l'état d'authentification côté client, sans
 * Firebase et sans abonnement permanent : un seul appel au montage, puis plus
 * rien. C'est ce qui remplace l'écouteur `onAuthStateChanged` dont la fuite
 * était signalée (l'écouteur n'était jamais détaché).
 *
 * L'utilisateur est relu **en base** et non extrait du jeton : celui-ci porte une
 * copie du rôle et de la formule au moment de son émission, donc potentiellement
 * périmée. Un compte désactivé ou rétrogradé doit être reflété immédiatement.
 */

/** Champs modifiables par l'utilisateur lui-même, volontairement limités. */
const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit faire au moins 2 caractères.').max(120).optional(),
  phone: z.string().trim().max(40, 'Numéro trop long.').optional(),
});

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  try {
    const user = await getAuthProvider().currentUser(
      scopeFromClaims(session.claims),
      session.claims.userId,
    );

    if (!user) {
      // Le jeton est valide mais l'utilisateur n'existe plus (compte supprimé,
      // ou organisation changée) : la session n'a plus de sens.
      return errorResponse('Session invalide.', 401);
    }

    if (user.status !== 'Actif') {
      return errorResponse('Ce compte est désactivé.', 403);
    }

    return NextResponse.json({ user });
  } catch (error) {
    return mapAuthError(error, 'GET /api/auth/me');
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  const body = await parseBody(request, updateProfileSchema);
  if (body.response) return body.response;

  const scope = scopeFromClaims(session.claims);

  try {
    await getUserProvider().update(scope, session.claims.userId, {
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(body.data.phone !== undefined ? { phone: body.data.phone } : {}),
    });

    // On relit l'utilisateur en base plutôt que de renvoyer ce qui a été envoyé :
    // la réponse reflète l'état réel, pas l'intention.
    const user = await getAuthProvider().currentUser(scope, session.claims.userId);
    if (!user) return errorResponse('Session invalide.', 401);

    return NextResponse.json({ user });
  } catch (error) {
    return mapAuthError(error, 'PATCH /api/auth/me');
  }
}

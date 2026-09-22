import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { invitationAcceptSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, mapAuthError, parseBody } from '@/lib/auth/api';
import { setSessionCookies } from '@/lib/auth/cookies';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * GET  /api/auth/invitation?token=… — informations de l'invitation.
 * POST /api/auth/invitation — acceptation : création du compte et session.
 *
 * **Publiques toutes les deux** : l'invité n'a pas encore de compte, c'est
 * précisément ce qu'il vient créer.
 *
 * Le `GET` sert à afficher **où** l'on est invité et **avec quel rôle**, avant
 * toute saisie. Sans cela, l'invité devrait créer un compte à l'aveugle, sans
 * savoir qui l'invite.
 */

/** Valide un jeton et retourne l'invitation, ou `null` sans le distinguer d'un autre cas. */
async function lookup(token: string) {
  return getAuthProvider().getInvitationByToken(token);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return errorResponse('Jeton manquant.', 400);

  try {
    const invitation = await lookup(token);

    if (!invitation) {
      // Un seul message pour « inconnue », « expirée », « révoquée » et « déjà
      // utilisée » : les distinguer n'aiderait pas l'invité et renseignerait un
      // curieux sur l'état des invitations.
      return errorResponse(
        'Cette invitation n’est plus valable. Demandez-en une nouvelle à la personne qui vous a invité.',
        404,
      );
    }

    // On n'expose ni l'identifiant d'organisation, ni l'identifiant
    // d'invitation : l'invité n'en a pas besoin.
    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organizationName,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return mapAuthError(error, 'GET /api/auth/invitation');
  }
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'invitation-accept', RATE_LIMITS.register);
  if (limited) return limited;

  const body = await parseBody(request, invitationAcceptSchema);
  if (body.response) return body.response;

  try {
    const session = await getAuthProvider().acceptInvitation(body.data.token, {
      name: body.data.name,
      password: body.data.password,
    });

    return setSessionCookies(
      NextResponse.json({
        user: session.user,
        accessTokenExpiresIn: session.accessTokenExpiresIn,
      }),
      session,
    );
  } catch (error) {
    return mapAuthError(error, 'POST /api/auth/invitation');
  }
}

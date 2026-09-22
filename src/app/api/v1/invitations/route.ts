import { NextResponse } from 'next/server';
import { getAuthProvider, getEmailProvider, INVITATION_TTL_DAYS } from '@/lib/providers';
import { invitationCreateSchema } from '@/lib/schemas/auth';
import {
  enforceRateLimit,
  errorResponse,
  mapAuthError,
  parseBody,
  requireSession,
  scopeFromClaims,
} from '@/lib/auth/api';
import { canAssignRole, canManageMembers } from '@/lib/auth/authorization';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { invitationEmail } from '@/lib/email/templates';
import { absoluteUrl } from '@/lib/email/urls';

/**
 * POST /api/v1/invitations — invite une personne dans l'organisation (REQ-ORG-05).
 * GET  /api/v1/invitations — liste les invitations en attente.
 *
 * **Le contrôle d'autorisation est ici, pas dans le middleware.** Celui-ci
 * s'exécute dans le runtime Edge, sans accès à la base : il ne peut vérifier
 * qu'un jeton. Le rôle est donc contrôlé dans la route, où l'organisation est
 * connue.
 */
export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  const limited = enforceRateLimit(request, 'invitation-create', RATE_LIMITS.register);
  if (limited) return limited;

  // Réservé à l'administration de l'organisation.
  if (!canManageMembers(session.claims.role)) {
    return errorResponse('Vous n’avez pas les droits pour inviter des membres.', 403);
  }

  const body = await parseBody(request, invitationCreateSchema);
  if (body.response) return body.response;

  // On ne peut pas attribuer un rôle supérieur au sien : sans cette règle, un
  // Admin pourrait créer un Propriétaire et s'élever par personne interposée.
  if (!canAssignRole(session.claims.role, body.data.role)) {
    return errorResponse(
      `Vous n’avez pas les droits pour attribuer le rôle « ${body.data.role} ».`,
      403,
    );
  }

  try {
    const created = await getAuthProvider().createInvitation(scopeFromClaims(session.claims), {
      email: body.data.email,
      role: body.data.role,
    });

    const invitationUrl = absoluteUrl(
      `/invitation?token=${encodeURIComponent(created.token)}`,
    );

    const email = invitationEmail({
      organizationName: created.invitation.organizationName,
      inviterName: session.claims.email,
      roleLabel: created.invitation.role,
      invitationUrl,
      expiresInDays: INVITATION_TTL_DAYS,
    });

    await getEmailProvider().send({
      to: created.invitation.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    // Le jeton en clair n'est PAS renvoyé : il ne doit exister que dans l'email.
    // Le renvoyer l'exposerait dans l'historique du navigateur et dans les logs
    // du client, pour aucun bénéfice.
    return NextResponse.json(
      {
        invitation: created.invitation,
        message: `Invitation envoyée à ${created.invitation.email}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    return mapAuthError(error, 'POST /api/v1/invitations');
  }
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  if (!canManageMembers(session.claims.role)) {
    return errorResponse('Vous n’avez pas les droits pour consulter les invitations.', 403);
  }

  try {
    const invitations = await getAuthProvider().listInvitations(
      scopeFromClaims(session.claims),
    );
    return NextResponse.json({ invitations });
  } catch (error) {
    return mapAuthError(error, 'GET /api/v1/invitations');
  }
}

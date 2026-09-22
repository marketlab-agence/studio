import { NextResponse } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { errorResponse, mapAuthError, requireSession, scopeFromClaims } from '@/lib/auth/api';
import { canManageMembers } from '@/lib/auth/authorization';

/**
 * DELETE /api/v1/invitations/[id] — révoque une invitation en attente.
 *
 * Le provider filtre par organisation : un identifiant d'invitation appartenant
 * à une autre organisation ne révoque rien, et la route répond la même chose
 * dans les deux cas pour ne pas révéler l'existence de l'invitation.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  if (!canManageMembers(session.claims.role)) {
    return errorResponse('Vous n’avez pas les droits pour révoquer une invitation.', 403);
  }

  const { id } = await context.params;
  if (!id) return errorResponse('Identifiant d’invitation manquant.', 400);

  try {
    await getAuthProvider().revokeInvitation(scopeFromClaims(session.claims), id);

    // Réponse identique que l'invitation ait existé ou non : la distinguer
    // permettrait de sonder les invitations d'autres organisations.
    return NextResponse.json({ message: 'Invitation révoquée.' });
  } catch (error) {
    return mapAuthError(error, 'DELETE /api/v1/invitations/[id]');
  }
}

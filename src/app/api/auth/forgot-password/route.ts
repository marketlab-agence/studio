import { NextResponse } from 'next/server';
import { getAuthProvider, getEmailProvider, RESET_TTL_MINUTES } from '@/lib/providers';
import { forgotPasswordSchema } from '@/lib/schemas/auth';
import { enforceRateLimit, errorResponse, parseBody } from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { passwordResetEmail } from '@/lib/email/templates';
import { absoluteUrl } from '@/lib/email/urls';

/**
 * POST /api/auth/forgot-password — demande de réinitialisation (REQ-AUTH-06).
 *
 * ⚠️ **Ce parcours est le seul chemin d'entrée des comptes repris de Firebase** :
 * leurs mots de passe n'ont pas pu être exportés, ils ont donc
 * `password_hash = NULL` et ne peuvent pas se connecter. Ce n'est pas un cas
 * particulier, c'est la voie normale.
 *
 * **Non-énumération** : la réponse est rigoureusement identique que l'adresse
 * corresponde à un compte ou non. Un message distinct (« cet email est
 * inconnu ») transformerait cette route en outil de recensement des comptes.
 *
 * ⚠️ Limite connue : l'envoi de l'email n'a lieu que si le compte existe, donc
 * le **temps de réponse diffère** légèrement. Le corriger supposerait d'envoyer
 * en tâche de fond, au prix d'un échec silencieux. Le compromis est assumé ici.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'forgot-password', RATE_LIMITS.forgotPassword);
  if (limited) return limited;

  const body = await parseBody(request, forgotPasswordSchema);
  if (body.response) return body.response;

  // Message unique, quelle que soit l'issue.
  const acknowledgement = {
    message:
      'Si un compte existe pour cette adresse, un email de réinitialisation vient ' +
      'd’être envoyé. Pensez à vérifier vos indésirables.',
  };

  try {
    const request_ = await getAuthProvider().requestPasswordReset(body.data.email);

    if (request_) {
      const resetUrl = absoluteUrl(
        `/reset-password?token=${encodeURIComponent(request_.token)}`,
      );

      const email = passwordResetEmail({
        name: request_.user.name,
        resetUrl,
        expiresInMinutes: RESET_TTL_MINUTES,
      });

      await getEmailProvider().send({
        to: request_.user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    }

    return NextResponse.json(acknowledgement);
  } catch (error) {
    // Un échec d'envoi ne doit pas non plus distinguer les cas : on journalise
    // et on répond la même chose. L'utilisateur qui n'a rien reçu redemandera.
    console.error('[auth] POST /api/auth/forgot-password — échec :', error);
    return NextResponse.json(acknowledgement);
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}

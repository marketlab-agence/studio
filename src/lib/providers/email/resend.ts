import { defaultFromAddress, type EmailMessage, type EmailProvider } from '../email';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Envoi par l'API Resend, **sans SDK** (simple `fetch`) : une dépendance de
 * moins, et rien à réinstaller si l'API évolue.
 *
 * Variables : `RESEND_API_KEY`, `EMAIL_FROM`.
 */
export class ResendEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY manquant : impossible d’envoyer un email via Resend.');
    }

    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: defaultFromAddress(),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: message.replyTo,
      }),
    });

    if (!response.ok) {
      // Le corps d'erreur de Resend est utile au diagnostic ; il ne contient
      // pas la clé d'API.
      throw new Error(
        `Resend a refusé l’envoi (HTTP ${response.status}) : ${await response.text()}`,
      );
    }
  }
}

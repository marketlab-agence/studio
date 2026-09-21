import nodemailer, { type Transporter } from 'nodemailer';
import { defaultFromAddress, type EmailMessage, type EmailProvider } from '../email';

/**
 * Envoi par SMTP générique (`nodemailer`).
 * Repli documenté du gate G3 : il n'engage aucun fournisseur et fonctionne avec
 * n'importe quel service exposant du SMTP.
 *
 * Variables : `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
 * `SMTP_PASSWORD`, `EMAIL_FROM`.
 */
export class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    if (!host) {
      throw new Error(
        'SMTP_HOST manquant : impossible d’envoyer un email. ' +
          'Renseigner SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD, ' +
          'ou choisir EMAIL_PROVIDER=memory (développement).',
      );
    }

    const user = process.env.SMTP_USER;

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      // Port 465 = TLS implicite ; 587 = STARTTLS.
      secure: process.env.SMTP_SECURE === 'true',
      auth: user ? { user, pass: process.env.SMTP_PASSWORD } : undefined,
    });

    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    await this.getTransporter().sendMail({
      from: defaultFromAddress(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo,
    });
  }

  async verify(): Promise<boolean> {
    try {
      await this.getTransporter().verify();
      return true;
    } catch (error) {
      console.error('[SmtpEmailProvider] vérification du transport échouée :', error);
      return false;
    }
  }
}

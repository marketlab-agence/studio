import type { EmailMessage, EmailProvider } from '../email';

export interface SentEmail extends EmailMessage {
  sentAt: Date;
}

/**
 * Transport en mémoire : **n'envoie rien**, conserve les messages pour
 * l'inspection.
 *
 * Usages : tests unitaires et base de test (aucun serveur SMTP requis), et
 * développement local — il vaut mieux un email tracé qu'un envoi silencieux ou
 * une exception qui bloque tout un parcours.
 */
export class MemoryEmailProvider implements EmailProvider {
  private readonly messages: SentEmail[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push({ ...message, sentAt: new Date() });
    console.info(`[MemoryEmailProvider] email retenu (non envoyé) → ${message.to} : ${message.subject}`);
  }

  /** Messages retenus, du plus ancien au plus récent. */
  get sent(): readonly SentEmail[] {
    return this.messages;
  }

  /** Dernier message retenu, ou `null`. */
  last(): SentEmail | null {
    return this.messages.at(-1) ?? null;
  }

  clear(): void {
    this.messages.length = 0;
  }

  async verify(): Promise<boolean> {
    return true;
  }
}

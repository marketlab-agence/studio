/**
 * Envoi d'emails (REQ-AUTH-10).
 *
 * Prérequis dur de la phase 4 : sans envoi d'email, le reset de mot de passe
 * forcé des comptes repris de Firebase est infaisable.
 *
 * L'interface remplace la signature esquissée dans `design.md` §2
 * (`send(to, subject, body)`) par un objet `EmailMessage` : la version
 * esquissée ne permettait ni HTML, ni réponse à une autre adresse — or un email
 * de réinitialisation doit contenir un lien cliquable.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  /** Version texte : toujours fournie, pour les clients qui n'affichent pas le HTML. */
  text: string;
  html?: string;
  /** Adresse de réponse, si différente de l'expéditeur. */
  replyTo?: string;
}

/**
 * Transport d'emails.
 *
 * Le choix du transport est fait par `EMAIL_PROVIDER` : `smtp` (défaut, repli
 * documenté du gate G3), `resend`, ou `memory` (tests et développement — aucun
 * envoi réel).
 */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
  /**
   * Vérifie que le transport est utilisable, sans envoyer d'email.
   * Utilisé par `/health` et par la pré-vol de la phase 4.
   * Optionnel : un transport sans état de connexion n'a rien à vérifier.
   */
  verify?(): Promise<boolean>;
}

/** Adresse d'expédition par défaut. */
export function defaultFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'Katalyst <no-reply@katalyst.local>';
}

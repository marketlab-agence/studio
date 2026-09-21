/**
 * Gabarits d'emails transactionnels.
 *
 * Chaque gabarit produit une version **texte** et une version **HTML** :
 *
 * - la version texte n'est pas un pis-aller. Un email de réinitialisation qui
 *   n'arrive qu'en HTML est illisible dans un client en mode texte, et certains
 *   filtres anti-spam pénalisent les messages sans alternative ;
 * - le HTML reste **sobre et sémantique** : pas de mise en page par tableaux
 *   imbriqués, pas d'image indispensable. Le lien est un vrai lien, lisible même
 *   sans styles.
 *
 * Aucun de ces gabarits n'insère de contenu utilisateur non échappé.
 */

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/** Échappe une valeur destinée à du HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface PasswordResetEmailInput {
  /** Nom de la personne, tel qu'il figure dans son compte. */
  name: string;
  /** Lien complet à cliquer. */
  resetUrl: string;
  /** Durée de validité du lien, en minutes. */
  expiresInMinutes: number;
  /** Nom de l'organisation, si connu — sinon « Katalyst ». */
  organizationName?: string;
}

export function passwordResetEmail(input: PasswordResetEmailInput): RenderedEmail {
  const organization = input.organizationName?.trim() || 'Katalyst';
  const name = input.name?.trim() || 'Bonjour';
  const expires = `${input.expiresInMinutes} minute${input.expiresInMinutes > 1 ? 's' : ''}`;

  const subject = `Réinitialisation de votre mot de passe — ${organization}`;

  const text = [
    `Bonjour ${name},`,
    '',
    `Vous avez demandé à réinitialiser votre mot de passe sur ${organization}.`,
    '',
    'Pour définir un nouveau mot de passe, ouvrez ce lien :',
    input.resetUrl,
    '',
    `Ce lien est valable ${expires} et ne peut servir qu'une seule fois.`,
    '',
    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message :",
    'votre mot de passe reste inchangé.',
    '',
    `— ${organization}`,
  ].join('\n');

  // Le lien est répété en clair sous le bouton : certains clients le
  // neutralisent, et l'utilisateur doit pouvoir le copier.
  const html = [
    '<!DOCTYPE html>',
    '<html lang="fr">',
    '<head><meta charset="utf-8"><title>',
    escapeHtml(subject),
    '</title></head>',
    '<body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#1a1a1a;">',
    `<p>Bonjour ${escapeHtml(name)},</p>`,
    `<p>Vous avez demandé à réinitialiser votre mot de passe sur <strong>${escapeHtml(organization)}</strong>.</p>`,
    `<p><a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;padding:12px 20px;background:#1e293b;color:#ffffff;text-decoration:none;border-radius:6px;">Définir un nouveau mot de passe</a></p>`,
    '<p style="font-size:14px;color:#4b5563;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>',
    `<a href="${escapeHtml(input.resetUrl)}">${escapeHtml(input.resetUrl)}</a></p>`,
    `<p style="font-size:14px;color:#4b5563;">Ce lien est valable ${escapeHtml(expires)} et ne peut servir qu'une seule fois.</p>`,
    "<p style=\"font-size:14px;color:#4b5563;\">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>",
    `<p style="font-size:14px;color:#4b5563;">— ${escapeHtml(organization)}</p>`,
    '</body></html>',
  ].join('\n');

  return { subject, text, html };
}

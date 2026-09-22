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

/**
 * Enveloppe HTML commune aux emails.
 *
 * Extraite plutôt que recopiée : la coquille (doctype, styles, signature)
 * évoluerait sinon dans un gabarit et pas dans l'autre.
 */
function htmlShell(subject: string, body: string[]): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="fr">',
    '<head><meta charset="utf-8"><title>',
    escapeHtml(subject),
    '</title></head>',
    '<body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#1a1a1a;">',
    ...body,
    '</body></html>',
  ].join('\n');
}

/** Bouton d'action, répété en clair dessous (certains clients le neutralisent). */
function actionButton(url: string, label: string): string[] {
  return [
    `<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;background:#1e293b;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a></p>`,
    '<p style="font-size:14px;color:#4b5563;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>',
    `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
  ];
}

const MUTED = 'font-size:14px;color:#4b5563;';

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
  const html = htmlShell(subject, [
    `<p>Bonjour ${escapeHtml(name)},</p>`,
    `<p>Vous avez demandé à réinitialiser votre mot de passe sur <strong>${escapeHtml(organization)}</strong>.</p>`,
    ...actionButton(input.resetUrl, 'Définir un nouveau mot de passe'),
    `<p style="${MUTED}">Ce lien est valable ${escapeHtml(expires)} et ne peut servir qu'une seule fois.</p>`,
    `<p style="${MUTED}">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>`,
    `<p style="${MUTED}">— ${escapeHtml(organization)}</p>`,
  ]);

  return { subject, text, html };
}

export interface InvitationEmailInput {
  /** Nom de l'organisation qui invite. */
  organizationName: string;
  /** Nom de la personne qui invite, si connu. */
  inviterName?: string;
  /** Rôle attribué à l'acceptation (libellé lisible). */
  roleLabel: string;
  /** Lien complet à cliquer. */
  invitationUrl: string;
  /** Durée de validité, en jours. */
  expiresInDays: number;
}

/**
 * Invitation à rejoindre une organisation (REQ-ORG-05).
 *
 * L'email nomme **qui invite** et **quel rôle** est proposé : sans ces deux
 * informations, le destinataire ne peut pas distinguer une invitation légitime
 * d'un message frauduleux, et accepterait à l'aveugle.
 */
export function invitationEmail(input: InvitationEmailInput): RenderedEmail {
  const organization = input.organizationName.trim() || 'Katalyst';
  const inviter = input.inviterName?.trim();
  const days = `${input.expiresInDays} jour${input.expiresInDays > 1 ? 's' : ''}`;

  const subject = `${inviter ? `${inviter} vous invite` : 'Vous êtes invité'} à rejoindre ${organization}`;

  const intro = inviter
    ? `${inviter} vous invite à rejoindre ${organization} sur Katalyst.`
    : `Vous êtes invité à rejoindre ${organization} sur Katalyst.`;

  const text = [
    'Bonjour,',
    '',
    intro,
    '',
    `Votre rôle : ${input.roleLabel}`,
    '',
    'Pour créer votre compte, ouvrez ce lien :',
    input.invitationUrl,
    '',
    `Ce lien est valable ${days} et ne peut servir qu'une seule fois.`,
    '',
    "Si vous n'attendiez pas cette invitation, ignorez ce message :",
    'aucun compte ne sera créé sans que vous cliquiez sur le lien.',
    '',
    `— ${organization}`,
  ].join('\n');

  const html = htmlShell(subject, [
    '<p>Bonjour,</p>',
    `<p>${escapeHtml(intro)}</p>`,
    `<p>Votre rôle : <strong>${escapeHtml(input.roleLabel)}</strong></p>`,
    ...actionButton(input.invitationUrl, 'Créer mon compte'),
    `<p style="${MUTED}">Ce lien est valable ${escapeHtml(days)} et ne peut servir qu'une seule fois.</p>`,
    `<p style="${MUTED}">Si vous n'attendiez pas cette invitation, ignorez ce message : aucun compte ne sera créé sans que vous cliquiez sur le lien.</p>`,
    `<p style="${MUTED}">— ${escapeHtml(organization)}</p>`,
  ]);

  return { subject, text, html };
}

import type { AiCreditProvider } from './ai-credits';
import type { AuthProvider } from './auth';
import type { ContentProvider } from './content';
import type { DocumentProvider } from './document';
import type { EmailProvider } from './email';
import type { NotificationProvider } from './notification';
import type { ProgressProvider } from './progress';
import type { SettingsProvider } from './settings';
import type { StorageProvider } from './storage';
import type { UserProvider } from './users';
import { JwtAuthProvider } from './auth/jwt';
import { PostgresAiCreditProvider } from './postgres/ai-credits';
import { PostgresContentProvider } from './postgres/content';
import { PostgresDocumentProvider } from './postgres/document';
import { PostgresNotificationProvider } from './postgres/notification';
import { PostgresProgressProvider } from './postgres/progress';
import { PostgresSettingsProvider } from './postgres/settings';
import { PostgresUserProvider } from './postgres/users';
import { MemoryEmailProvider } from './email/memory';
import { ResendEmailProvider } from './email/resend';
import { SmtpEmailProvider } from './email/smtp';
import { LocalStorageProvider } from './storage/local';
import { S3StorageProvider } from './storage/s3';

/**
 * Sélection des implémentations (zero vendor lock-in).
 *
 * Le fournisseur est choisi par variable d'environnement — aucun appelant ne
 * connaît l'implémentation. Changer de backend ne touche donc **aucun** code
 * métier : voir ADR 0001 et `.kiro/steering/security-standards.md`.
 *
 * Les instances sont mémorisées : les providers sont sans état.
 */

function unknownProvider(variable: string, value: string, supported: string[]): never {
  throw new Error(
    `${variable} inconnu : "${value}". Valeurs supportées : ${supported.join(', ')}.`,
  );
}

let contentProvider: ContentProvider | null = null;
let userProvider: UserProvider | null = null;
let settingsProvider: SettingsProvider | null = null;
let emailProvider: EmailProvider | null = null;
let storageProvider: StorageProvider | null = null;
let aiCreditProvider: AiCreditProvider | null = null;
let notificationProvider: NotificationProvider | null = null;
let documentProvider: DocumentProvider | null = null;
let progressProvider: ProgressProvider | null = null;
let authProvider: AuthProvider | null = null;

export function getContentProvider(): ContentProvider {
  if (contentProvider) return contentProvider;

  const provider = process.env.DATA_PROVIDER ?? 'postgres';
  switch (provider) {
    case 'postgres':
      contentProvider = new PostgresContentProvider();
      return contentProvider;
    default:
      return unknownProvider('DATA_PROVIDER', provider, ['postgres']);
  }
}

export function getUserProvider(): UserProvider {
  if (userProvider) return userProvider;

  const provider = process.env.DATA_PROVIDER ?? 'postgres';
  switch (provider) {
    case 'postgres':
      userProvider = new PostgresUserProvider();
      return userProvider;
    default:
      return unknownProvider('DATA_PROVIDER', provider, ['postgres']);
  }
}

export function getSettingsProvider(): SettingsProvider {
  if (settingsProvider) return settingsProvider;

  const provider = process.env.DATA_PROVIDER ?? 'postgres';
  switch (provider) {
    case 'postgres':
      settingsProvider = new PostgresSettingsProvider();
      return settingsProvider;
    default:
      return unknownProvider('DATA_PROVIDER', provider, ['postgres']);
  }
}

/**
 * Transport d'emails. Défaut `smtp` (repli du gate G3, sans engagement) ;
 * `memory` n'envoie rien et convient aux tests et au développement local.
 */
export function getEmailProvider(): EmailProvider {
  if (emailProvider) return emailProvider;

  const provider = process.env.EMAIL_PROVIDER ?? 'smtp';
  switch (provider) {
    case 'smtp':
      emailProvider = new SmtpEmailProvider();
      return emailProvider;
    case 'resend':
      emailProvider = new ResendEmailProvider();
      return emailProvider;
    case 'memory':
      emailProvider = new MemoryEmailProvider();
      return emailProvider;
    default:
      return unknownProvider('EMAIL_PROVIDER', provider, ['smtp', 'resend', 'memory']);
  }
}

/**
 * Stockage des fichiers. Défaut `local` (système de fichiers, aucun prérequis) ;
 * `s3` pour tout service compatible S3, sans SDK.
 */
export function getStorageProvider(): StorageProvider {
  if (storageProvider) return storageProvider;

  const provider = process.env.STORAGE_PROVIDER ?? 'local';
  switch (provider) {
    case 'local':
      storageProvider = new LocalStorageProvider();
      return storageProvider;
    case 's3':
      storageProvider = new S3StorageProvider();
      return storageProvider;
    default:
      return unknownProvider('STORAGE_PROVIDER', provider, ['local', 's3']);
  }
}

/** Crédits IA et journal des générations. */
export function getAiCreditProvider(): AiCreditProvider {
  if (aiCreditProvider) return aiCreditProvider;

  const provider = process.env.DATA_PROVIDER ?? 'postgres';
  switch (provider) {
    case 'postgres':
      aiCreditProvider = new PostgresAiCreditProvider();
      return aiCreditProvider;
    default:
      return unknownProvider('DATA_PROVIDER', provider, ['postgres']);
  }
}

/**
 * Notifications (in-app, email, push).
 * Le transport email est passé de façon paresseuse : le provider de
 * notifications n'a pas à le construire, et il reste substituable en test.
 */
export function getNotificationProvider(): NotificationProvider {
  if (notificationProvider) return notificationProvider;

  const provider = process.env.DATA_PROVIDER ?? 'postgres';
  switch (provider) {
    case 'postgres':
      notificationProvider = new PostgresNotificationProvider(() => getEmailProvider());
      return notificationProvider;
    default:
      return unknownProvider('DATA_PROVIDER', provider, ['postgres']);
  }
}

/** Base documentaire (ingestion, segments, recherche vectorielle). */
export function getDocumentProvider(): DocumentProvider {
  if (documentProvider) return documentProvider;

  const provider = process.env.DATA_PROVIDER ?? 'postgres';
  switch (provider) {
    case 'postgres':
      documentProvider = new PostgresDocumentProvider();
      return documentProvider;
    default:
      return unknownProvider('DATA_PROVIDER', provider, ['postgres']);
  }
}

/** Authentification (JWT + bcrypt + refresh rotatif). */
export function getAuthProvider(): AuthProvider {
  if (authProvider) return authProvider;

  const provider = process.env.AUTH_PROVIDER ?? 'jwt';
  switch (provider) {
    case 'jwt':
      authProvider = new JwtAuthProvider();
      return authProvider;
    default:
      return unknownProvider('AUTH_PROVIDER', provider, ['jwt']);
  }
}

/** Progression des apprenants (leçons terminées, scores, point de reprise). */
export function getProgressProvider(): ProgressProvider {
  if (progressProvider) return progressProvider;

  const provider = process.env.DATA_PROVIDER ?? 'postgres';
  switch (provider) {
    case 'postgres':
      progressProvider = new PostgresProgressProvider();
      return progressProvider;
    default:
      return unknownProvider('DATA_PROVIDER', provider, ['postgres']);
  }
}

/** Réinitialise les instances mémorisées (tests). */
export function resetProviders(): void {
  contentProvider = null;
  userProvider = null;
  settingsProvider = null;
  emailProvider = null;
  storageProvider = null;
  aiCreditProvider = null;
  notificationProvider = null;
  documentProvider = null;
  authProvider = null;
  progressProvider = null;
}

// --- Ré-exports : un seul point d'entrée pour les appelants -------------------
export * from './types';
export * from './ai-credits';
export * from './auth';
export * from './content';
export * from './document';
export * from './email';
export * from './notification';
export * from './progress';
export * from './settings';
export * from './storage';
export * from './users';
export { getRequestScope } from './scope';

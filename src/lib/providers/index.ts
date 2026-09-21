import type { ContentProvider } from './content';
import type { SettingsProvider } from './settings';
import type { UserProvider } from './users';
import { PostgresContentProvider } from './postgres/content';
import { PostgresSettingsProvider } from './postgres/settings';
import { PostgresUserProvider } from './postgres/users';

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

/** Réinitialise les instances mémorisées (tests). */
export function resetProviders(): void {
  contentProvider = null;
  userProvider = null;
  settingsProvider = null;
}

// --- Ré-exports : un seul point d'entrée pour les appelants -------------------
export * from './types';
export * from './content';
export * from './settings';
export * from './users';
export { getRequestScope } from './scope';

import { query } from '@/lib/db/pool';

/**
 * Paramètres applicatifs, stockés dans la table `settings` (clé/valeur JSONB).
 * Aligné sur `src/data/settings.json`.
 */
export interface AppSettings {
  instructorName: string;
}

/**
 * Contrat d'accès aux paramètres. L'implémentation est interchangeable
 * (zero vendor lock-in, voir .kiro/steering/security-standards.md).
 */
export interface SettingsProvider {
  getSettings(): Promise<AppSettings>;
}

const DEFAULT_SETTINGS: AppSettings = {
  instructorName: 'Instructeur par défaut',
};

const SETTINGS_KEY = 'app';

/** Implémentation PostgreSQL. */
export class PostgresSettingsProvider implements SettingsProvider {
  async getSettings(): Promise<AppSettings> {
    const { rows } = await query<{ value: AppSettings }>(
      'SELECT value FROM settings WHERE key = $1',
      [SETTINGS_KEY],
    );
    return rows[0]?.value ?? DEFAULT_SETTINGS;
  }
}

/**
 * Retourne l'implémentation configurée.
 * Sélection par `DATA_PROVIDER` (défaut : postgres).
 */
export function getSettingsProvider(): SettingsProvider {
  const provider = process.env.DATA_PROVIDER ?? 'postgres';

  switch (provider) {
    case 'postgres':
      return new PostgresSettingsProvider();
    default:
      throw new Error(
        `DATA_PROVIDER inconnu : "${provider}". Valeurs supportées : postgres.`,
      );
  }
}

/** Raccourci : lit les paramètres via le provider configuré. */
export function getSettings(): Promise<AppSettings> {
  return getSettingsProvider().getSettings();
}

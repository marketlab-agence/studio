import { query } from '@/lib/db/pool';
import { assertScope, type OrgScope } from '../types';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  type AppSettings,
  type SettingsProvider,
} from '../settings';

/**
 * Paramètres applicatifs, stockés par organisation dans la table `settings`.
 * Chaque requête est filtrée par `organization_id` : une organisation ne peut
 * pas lire les paramètres d'une autre.
 */
export class PostgresSettingsProvider implements SettingsProvider {
  async getSettings(scope: OrgScope): Promise<AppSettings> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<{ value: AppSettings }>(
      'SELECT value FROM settings WHERE organization_id = $1 AND key = $2',
      [organizationId, SETTINGS_KEY],
    );

    return rows[0]?.value ?? DEFAULT_SETTINGS;
  }

  async saveSettings(scope: OrgScope, settings: AppSettings): Promise<void> {
    const { organizationId } = assertScope(scope);

    await query(
      `INSERT INTO settings (organization_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, key) DO UPDATE SET
         value = EXCLUDED.value, updated_at = NOW()`,
      [organizationId, SETTINGS_KEY, JSON.stringify(settings)],
    );
  }
}

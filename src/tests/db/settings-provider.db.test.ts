import { PostgresSettingsProvider, getSettingsProvider } from '@/lib/providers/settings';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Vérifie le contrat SettingsProvider contre une vraie base PostgreSQL.
 * Sert de référence aux providers des phases suivantes.
 */
describe('PostgresSettingsProvider', () => {
  const provider = new PostgresSettingsProvider();

  // Prérequis : la migration 001 doit être appliquée (npm run db:migrate).

  it('lit les paramètres depuis la table settings', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const settings = await provider.getSettings();

    expect(settings).toHaveProperty('instructorName');
    expect(typeof settings.instructorName).toBe('string');
    expect(settings.instructorName.length).toBeGreaterThan(0);
  });

  it('retombe sur les valeurs par défaut si la clé est absente', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    await pool.query('DELETE FROM settings WHERE key = $1', ['app']);
    try {
      const settings = await provider.getSettings();
      expect(settings.instructorName).toBe('Instructeur par défaut');
    } finally {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        ['app', JSON.stringify({ instructorName: 'Alex Dubois' })],
      );
    }
  });

  it('est sélectionnable par la variable DATA_PROVIDER', () => {
    const previous = process.env.DATA_PROVIDER;
    process.env.DATA_PROVIDER = 'postgres';
    try {
      expect(getSettingsProvider()).toBeInstanceOf(PostgresSettingsProvider);
    } finally {
      process.env.DATA_PROVIDER = previous;
    }
  });

  it('refuse un DATA_PROVIDER inconnu', () => {
    const previous = process.env.DATA_PROVIDER;
    process.env.DATA_PROVIDER = 'inexistant';
    try {
      expect(() => getSettingsProvider()).toThrow(/DATA_PROVIDER inconnu/);
    } finally {
      process.env.DATA_PROVIDER = previous;
    }
  });
});

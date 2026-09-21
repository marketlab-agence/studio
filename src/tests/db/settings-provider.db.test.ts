import {
  getSettingsProvider,
  resetProviders,
  type OrgScope,
  type SettingsProvider,
} from '@/lib/providers';
import { PostgresSettingsProvider } from '@/lib/providers/postgres/settings';
import { DEFAULT_SETTINGS } from '@/lib/providers/settings';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Vérifie le contrat SettingsProvider contre une vraie base PostgreSQL.
 * La base de test est seedée (`npm run db:seed:test`) : une organisation
 * « katalyst » avec ses paramètres existe.
 */
describe('PostgresSettingsProvider', () => {
  let provider: SettingsProvider;
  let scope: OrgScope | null = null;

  beforeEach(() => {
    resetProviders();
    provider = getSettingsProvider();
  });

  async function resolveScope(): Promise<OrgScope | null> {
    if (scope) return scope;

    const { rows } = await pool.query<{ organization_id: string; user_id: string; role: string }>(
      `SELECT o.id AS organization_id, u.id AS user_id, u.role
       FROM organizations o JOIN users u ON u.organization_id = o.id
       ORDER BY o.created_at LIMIT 1`,
    );
    if (rows.length === 0) return null;

    scope = {
      organizationId: rows[0].organization_id,
      userId: rows[0].user_id,
      role: rows[0].role as OrgScope['role'],
    };
    return scope;
  }

  it('lit les paramètres de l’organisation', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    const resolved = await resolveScope();
    if (!resolved) throw new Error('Base non seedée : exécuter `npm run db:seed:test`.');

    const settings = await provider.getSettings(resolved);

    expect(settings).toHaveProperty('instructorName');
    expect(settings.instructorName).toBe('Alex Dubois');
  });

  it('écrit puis relit les paramètres', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    const resolved = await resolveScope();
    if (!resolved) throw new Error('Base non seedée.');

    await provider.saveSettings(resolved, { instructorName: 'Formateur Test' });
    expect((await provider.getSettings(resolved)).instructorName).toBe('Formateur Test');

    // Restauration de la valeur seedée.
    await provider.saveSettings(resolved, { instructorName: 'Alex Dubois' });
    expect((await provider.getSettings(resolved)).instructorName).toBe('Alex Dubois');
  });

  it('refuse un appel sans scope', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    // @ts-expect-error — vérifie que l'absence de scope est rejetée à l'exécution.
    await expect(provider.getSettings(undefined)).rejects.toThrow(/Organisation manquante/);
  });

  it('retombe sur les valeurs par défaut si l’organisation n’a rien configuré', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    const resolved = await resolveScope();
    if (!resolved) throw new Error('Base non seedée.');

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO organizations (name, slug) VALUES ('Org sans paramètres', 'org-sans-parametres')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    );
    const emptyScope: OrgScope = {
      organizationId: rows[0].id,
      userId: resolved.userId,
      role: 'Propriétaire',
    };

    const settings = await provider.getSettings(emptyScope);
    expect(settings).toEqual(DEFAULT_SETTINGS);

    await pool.query('DELETE FROM organizations WHERE slug = $1', ['org-sans-parametres']);
  });

  it('est sélectionnable par DATA_PROVIDER et rejette une valeur inconnue', () => {
    const previous = process.env.DATA_PROVIDER;
    try {
      process.env.DATA_PROVIDER = 'postgres';
      resetProviders();
      // Une nouvelle instance est créée après reset : on vérifie le type, pas l'identité.
      expect(getSettingsProvider()).toBeInstanceOf(PostgresSettingsProvider);

      process.env.DATA_PROVIDER = 'inexistant';
      resetProviders();
      expect(() => getSettingsProvider()).toThrow(/DATA_PROVIDER inconnu/);
    } finally {
      process.env.DATA_PROVIDER = previous;
      resetProviders();
    }
  });
});

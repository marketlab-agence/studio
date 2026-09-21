import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Vérifie que l'infrastructure de test PostgreSQL fonctionne.
 * Sert de prérequis aux tests d'intégration des providers (phases 2-3).
 */
describe('Infrastructure de test PostgreSQL', () => {
  it('se connecte à la base de test', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const { rows } = await pool.query<{ ok: number }>('SELECT 1 AS ok');
    expect(rows[0].ok).toBe(1);
  });

  it("expose l'extension vectorielle pgvector", async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const { rows } = await pool.query<{ extname: string }>(
      "SELECT extname FROM pg_extension WHERE extname = 'vector'",
    );
    expect(rows).toHaveLength(1);
  });

  it('permet de créer et d\'interroger une table temporaire', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    await pool.query('CREATE TEMP TABLE katalyst_smoke (id INT PRIMARY KEY, label TEXT)');
    await pool.query('INSERT INTO katalyst_smoke (id, label) VALUES ($1, $2)', [1, 'ok']);

    const { rows } = await pool.query<{ label: string }>(
      'SELECT label FROM katalyst_smoke WHERE id = $1',
      [1],
    );
    expect(rows[0].label).toBe('ok');
  });
});

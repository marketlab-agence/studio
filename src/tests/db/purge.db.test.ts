import { Pool } from 'pg';
import { pool, requireDatabaseOrSkip, TEST_DATABASE_URL } from './setup';
import { assertSafeDatabase, purgeTestData } from '../../../e2e/helpers/purge';

/**
 * Vérifie que la purge E2E supprime les données de test SANS jamais toucher
 * aux données réelles. Sur `katalyst_test` : la base est seedée, donc
 * l'organisation « katalyst » et ses comptes existent réellement.
 */
describe('purgeTestData', () => {
  const MARQUEUR_ORG = 'test-purge-fixture';
  const EMAIL_TEST = 'purge-fixture@e2e.local';

  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  afterEach(async () => {
    await pool.query('DELETE FROM organizations WHERE slug = $1', [MARQUEUR_ORG]);
    await pool.query('DELETE FROM users WHERE email = $1', [EMAIL_TEST]);
  });

  it('supprime une organisation marquée et ses dépendances en cascade', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO organizations (name, slug) VALUES ('Purge Fixture', $1) RETURNING id`,
      [MARQUEUR_ORG],
    );
    const orgId = rows[0].id;
    await pool.query(
      `INSERT INTO users (organization_id, email, name, role, status)
       VALUES ($1, $2, 'Fixture', 'Utilisateur', 'Actif')`,
      [orgId, EMAIL_TEST],
    );

    const report = await purgeTestData(pool);

    expect(report.organizations).toBeGreaterThanOrEqual(1);
    const restantes = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    expect(restantes.rowCount).toBe(0);
    const utilisateurs = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL_TEST]);
    expect(utilisateurs.rowCount).toBe(0);
  });

  it('préserve l’organisation katalyst', async () => {
    await purgeTestData(pool);

    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM organizations WHERE slug = 'katalyst'`,
    );
    expect(rows.length).toBe(1);
  });

  it('préserve un utilisateur au vrai email', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT u.id FROM users u JOIN organizations o ON o.id = u.organization_id
       WHERE o.slug = 'katalyst' AND u.email NOT LIKE '%@e2e.local' LIMIT 1`,
    );
    expect(rows.length).toBe(1);

    await purgeTestData(pool);

    const apres = await pool.query('SELECT id FROM users WHERE id = $1', [rows[0].id]);
    expect(apres.rowCount).toBe(1);
  });

  it('supprime les utilisateurs @e2e.local orphelins rattachés à katalyst', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM organizations WHERE slug = 'katalyst'`,
    );
    await pool.query(
      `INSERT INTO users (organization_id, email, name, role, status)
       VALUES ($1, $2, 'Orphelin', 'Utilisateur', 'Actif')`,
      [rows[0].id, EMAIL_TEST],
    );

    const report = await purgeTestData(pool);

    expect(report.orphanUsers).toBeGreaterThanOrEqual(1);
    const restants = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL_TEST]);
    expect(restants.rowCount).toBe(0);
  });

  it('est idempotent : deux exécutions donnent le même état', async () => {
    await purgeTestData(pool);
    const premier = await pool.query('SELECT COUNT(*)::int AS n FROM organizations');
    await purgeTestData(pool);
    const second = await pool.query('SELECT COUNT(*)::int AS n FROM organizations');

    expect(second.rows[0].n).toBe(premier.rows[0].n);
  });

  it('refuse une base interdite (port 5432)', () => {
    expect(() =>
      assertSafeDatabase('postgresql://postgres:postgres@localhost:5432/katalyst'),
    ).toThrow(/5432/);
  });

  it('refuse une base masterplan365', () => {
    expect(() =>
      assertSafeDatabase('postgresql://postgres:postgres@localhost:5433/masterplan365'),
    ).toThrow(/masterplan365/i);
  });

  it('accepte la base de test', () => {
    expect(() => assertSafeDatabase(TEST_DATABASE_URL)).not.toThrow();
  });
});

import { pool, requireDatabaseOrSkip, TEST_DATABASE_URL } from './setup';
import { assertSafeDatabase, purgeTestData } from '../../../e2e/helpers/purge';

/**
 * Vérifie que la purge E2E supprime les données de test SANS jamais toucher
 * aux données réelles. Sur `katalyst_test` : la base est seedée, donc
 * l'organisation « katalyst » et ses comptes existent réellement.
 *
 * ⚠️ Les fixtures portent un **suffixe hexadécimal**, comme les vrais résidus
 * de test : un slug sans suffixe est précisément ce que la purge doit préserver.
 */
describe('purgeTestData', () => {
  const MARQUEUR_ORG = 'test-purge-fixture-a1b2c3';
  const MARQUEUR_ORG_SANS_SUFFIXE = 'institut-national';
  const EMAIL_TEST = 'purge-fixture@e2e.local';

  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  afterEach(async () => {
    await pool.query('DELETE FROM organizations WHERE slug = ANY($1::text[])', [
      [MARQUEUR_ORG, MARQUEUR_ORG_SANS_SUFFIXE],
    ]);
    await pool.query('DELETE FROM users WHERE email = $1', [EMAIL_TEST]);
  });

  async function creerOrganisation(slug: string): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO organizations (name, slug) VALUES ('Fixture', $1) RETURNING id`,
      [slug],
    );
    return rows[0].id;
  }

  it('supprime une organisation marquée et ses dépendances en cascade', async () => {
    const orgId = await creerOrganisation(MARQUEUR_ORG);
    // ⚠️ L'email enfant est volontairement **hors** du domaine `@e2e.local` :
    // sinon le second DELETE suffirait à le faire disparaître, et le test ne
    // prouverait rien de la cascade.
    await pool.query(
      `INSERT INTO users (organization_id, email, name, role, status)
       VALUES ($1, 'enfant-cascade@example.test', 'Fixture', 'Utilisateur', 'Actif')`,
      [orgId],
    );

    const report = await purgeTestData(pool);

    expect(report.organizations).toBeGreaterThanOrEqual(1);
    const restantes = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    expect(restantes.rowCount).toBe(0);
    const enfants = await pool.query(
      `SELECT id FROM users WHERE email = 'enfant-cascade@example.test'`,
    );
    expect(enfants.rowCount).toBe(0);
  });

  it('préserve l’organisation katalyst', async () => {
    await purgeTestData(pool);

    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM organizations WHERE slug = 'katalyst'`,
    );
    expect(rows.length).toBe(1);
  });

  it('préserve un slug au préfixe connu mais SANS suffixe de test', async () => {
    const orgId = await creerOrganisation(MARQUEUR_ORG_SANS_SUFFIXE);

    await purgeTestData(pool);

    const restante = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    expect(restante.rowCount).toBe(1);
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
    // ⚠️ Comparer un **état réellement modifié** : sans fixture à purger, une
    // purge qui ne ferait rien passerait ce test.
    await creerOrganisation(MARQUEUR_ORG);

    await purgeTestData(pool);
    const premier = await pool.query<{ orgs: number; users: number }>(
      `SELECT (SELECT COUNT(*)::int FROM organizations) AS orgs,
              (SELECT COUNT(*)::int FROM users) AS users`,
    );
    await purgeTestData(pool);
    const second = await pool.query<{ orgs: number; users: number }>(
      `SELECT (SELECT COUNT(*)::int FROM organizations) AS orgs,
              (SELECT COUNT(*)::int FROM users) AS users`,
    );

    expect(second.rows[0]).toEqual(premier.rows[0]);
  });

  it('refuse une base hors du port 5433', () => {
    expect(() =>
      assertSafeDatabase('postgresql://postgres:postgres@localhost:5432/katalyst'),
    ).toThrow(/5433/);
  });

  it('refuse une base masterplan365', () => {
    expect(() =>
      assertSafeDatabase('postgresql://postgres:postgres@localhost:5433/masterplan365'),
    ).toThrow(/masterplan365/i);
  });

  it('ne laisse jamais fuir le mot de passe dans son message d’erreur', () => {
    try {
      assertSafeDatabase('postgresql://user:mo:tp@ss@localhost:9999/katalyst');
      throw new Error('assertSafeDatabase aurait dû refuser cette URL');
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      expect(message).not.toContain('mo:tp@ss');
      expect(message).not.toContain('tp@ss');
    }
  });

  it('accepte la base de test', () => {
    expect(() => assertSafeDatabase(TEST_DATABASE_URL)).not.toThrow();
  });
});

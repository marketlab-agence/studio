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
  const EMAIL_TEST = 'purge-fixture@e2e.local';

  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  afterEach(async () => {
    await pool.query(
      `DELETE FROM organizations WHERE slug LIKE 'test-purge-%' OR slug LIKE 'institut-national%' OR slug LIKE 'institut-parcours%'`,
    );
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

  it('préserve une organisation réelle au nom plausible', async () => {
    // ⚠️ L'application pose elle-même un suffixe aléatoire sur TOUTE organisation
    // (`jwt.ts:216`) : « Institut National » devient `institut-national-<hex6>`,
    // indiscernable d'une fixture par son suffixe. C'est donc le NOM qui doit
    // protéger, pas le suffixe. Ce test le prouve explicitement.
    const orgId = await creerOrganisation('institut-national-a1b2c3');

    await purgeTestData(pool);

    const restante = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    expect(restante.rowCount).toBe(1);
  });

  it('supprime les fixtures littérales d’invitation (Institut Parcours…)', async () => {
    const orgId = await creerOrganisation('institut-parcours-a1b2c3');

    await purgeTestData(pool);

    const restante = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    expect(restante.rowCount).toBe(0);
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
    await creerOrganisation(MARQUEUR_ORG);

    const avant = await pool.query<{ orgs: number }>(
      `SELECT COUNT(*)::int AS orgs FROM organizations WHERE slug = $1`,
      [MARQUEUR_ORG],
    );
    expect(avant.rows[0].orgs).toBe(1);

    await purgeTestData(pool);

    // ⚠️ On assère que la fixture a bien **disparu** : sans cela, une purge
    // inerte laisserait le comptage inchangé et le test d'idempotence passerait
    // à tort.
    const apresPremiere = await pool.query<{ orgs: number; users: number }>(
      `SELECT (SELECT COUNT(*)::int FROM organizations) AS orgs,
              (SELECT COUNT(*)::int FROM users) AS users`,
    );
    const fixture = await pool.query(`SELECT id FROM organizations WHERE slug = $1`, [MARQUEUR_ORG]);
    expect(fixture.rowCount).toBe(0);

    await purgeTestData(pool);
    const apresSeconde = await pool.query<{ orgs: number; users: number }>(
      `SELECT (SELECT COUNT(*)::int FROM organizations) AS orgs,
              (SELECT COUNT(*)::int FROM users) AS users`,
    );

    expect(apresSeconde.rows[0]).toEqual(apresPremiere.rows[0]);
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

  it('refuse de purger au-delà du plafond de sécurité, SANS rien supprimer', async () => {
    // ⚠️ Le plafond doit être éprouvé pour de vrai : un test qui se contente de
    // constater sa valeur ne prouve rien. On abaisse le plafond sous le nombre
    // de lignes marquées, puis on vérifie que la purge **refuse** et que la
    // fixture est **toujours là** — c'est le point crucial : le comptage
    // préalable doit empêcher la suppression, pas la constater après coup.
    const orgId = await creerOrganisation(MARQUEUR_ORG);

    await expect(purgeTestData(pool, { maxOrganizations: 0 })).rejects.toThrow(/plafond/);

    const restante = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    expect(restante.rowCount).toBe(1);
  });
});

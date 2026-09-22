import {
  getAuthProvider,
  resetProviders,
  SamlAccountNotFoundError,
  type AuthProvider,
  type OrgScope,
} from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Connexion par SSO SAML (T4.5, REQ-AUTH-05).
 *
 * La signature de l'assertion est vérifiée en amont (`src/lib/auth/saml.ts`) et
 * exige un échange réel avec un fournisseur d'identité. Ce qui est vérifié ici,
 * c'est ce que le provider fait d'une identité **déjà validée** :
 *
 * - il **exige un compte préexistant** dans l'organisation — une assertion
 *   prouve une identité, pas un droit d'accès ;
 * - il **ne franchit pas la frontière d'organisation** : une adresse valide
 *   d'une autre organisation ne donne pas accès ici.
 */

jest.setTimeout(90_000);

const TEST_DOMAIN = '@saml-test.local';
const PASSWORD = 'un-mot-de-passe-solide-2026';

let provider: AuthProvider;
let scopeA: OrgScope;
let organizationBId: string;

async function prepare(): Promise<boolean> {
  const { rows } = await pool.query<{ organization_id: string; user_id: string; role: string }>(
    `SELECT o.id AS organization_id, u.id AS user_id, u.role
     FROM organizations o JOIN users u ON u.organization_id = o.id
     ORDER BY o.created_at LIMIT 1`,
  );
  if (rows.length === 0) return false;

  scopeA = {
    organizationId: rows[0].organization_id,
    userId: rows[0].user_id,
    role: rows[0].role as OrgScope['role'],
  };

  const other = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, slug) VALUES ('Org SAML B', 'saml-org-b')
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
  );
  organizationBId = other.rows[0].id;

  return true;
}

async function cleanup(): Promise<void> {
  await pool.query('DELETE FROM organizations WHERE slug = $1', ['saml-org-b']);
  await pool.query(
    `DELETE FROM organizations
     WHERE id IN (SELECT organization_id FROM users WHERE email LIKE $1)`,
    [`%${TEST_DOMAIN}`],
  );
}

describe('connexion SAML', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    await cleanup();
    if (!(await prepare())) throw new Error('Base non seedée.');
    provider = getAuthProvider();
  });

  afterAll(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  it('ouvre une session pour un compte existant et actif', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const created = await provider.register({
      email: `formateur${TEST_DOMAIN}`,
      password: PASSWORD,
      name: 'Formateur SAML',
    });

    const session = await provider.loginWithSaml(created.user.organizationId, {
      email: `formateur${TEST_DOMAIN}`,
      name: 'Formateur SAML',
    });

    expect(session.user.id).toBe(created.user.id);
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
  }, 60_000);

  it('normalise l’adresse avant la recherche', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const created = await provider.register({
      email: `casse${TEST_DOMAIN}`,
      password: PASSWORD,
      name: 'Casse',
    });

    // Le fournisseur d'identité peut renvoyer une casse différente : elle ne
    // doit pas empêcher de retrouver le compte.
    const session = await provider.loginWithSaml(created.user.organizationId, {
      email: `CASSE${TEST_DOMAIN.toUpperCase()}`,
      name: 'Casse',
    });

    expect(session.user.id).toBe(created.user.id);
  }, 60_000);

  it('REFUSE une identité sans compte correspondant', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    // Pas de provisionnement automatique : l'administrateur du fournisseur
    // d'identité ne doit pas pouvoir ouvrir des accès dans l'organisation.
    await expect(
      provider.loginWithSaml(scopeA.organizationId, {
        email: `inconnu${TEST_DOMAIN}`,
        name: 'Inconnu',
      }),
    ).rejects.toBeInstanceOf(SamlAccountNotFoundError);
  });

  it('REFUSE de franchir la frontière d’organisation', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    // Un compte existe bien, mais dans l'organisation A.
    await provider.register({
      email: `ailleurs${TEST_DOMAIN}`,
      password: PASSWORD,
      name: 'Ailleurs',
    });

    // L'assertion est valide, mais elle est présentée à l'organisation B :
    // l'appartenance se vérifie, elle ne se déduit pas d'une adresse.
    await expect(
      provider.loginWithSaml(organizationBId, {
        email: `ailleurs${TEST_DOMAIN}`,
        name: 'Ailleurs',
      }),
    ).rejects.toBeInstanceOf(SamlAccountNotFoundError);
  }, 60_000);

  it('refuse un compte désactivé', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const created = await provider.register({
      email: `inactif${TEST_DOMAIN}`,
      password: PASSWORD,
      name: 'Inactif',
    });
    await pool.query("UPDATE users SET status = 'Inactif' WHERE id = $1", [created.user.id]);

    await expect(
      provider.loginWithSaml(created.user.organizationId, {
        email: `inactif${TEST_DOMAIN}`,
        name: 'Inactif',
      }),
    ).rejects.toThrow(/désactivé/);
  }, 60_000);

  it('met à jour la date de dernière connexion', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const created = await provider.register({
      email: `last-login${TEST_DOMAIN}`,
      password: PASSWORD,
      name: 'Dernière Connexion',
    });
    await pool.query('UPDATE users SET last_login = NULL WHERE id = $1', [created.user.id]);

    await provider.loginWithSaml(created.user.organizationId, {
      email: `last-login${TEST_DOMAIN}`,
      name: 'Dernière Connexion',
    });

    const { rows } = await pool.query<{ last_login: Date | null }>(
      'SELECT last_login FROM users WHERE id = $1',
      [created.user.id],
    );
    expect(rows[0].last_login).not.toBeNull();
  }, 60_000);
});

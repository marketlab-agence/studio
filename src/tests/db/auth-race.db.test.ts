import {
  getAuthProvider,
  GoogleAccountConflictError,
  resetProviders,
  type AuthProvider,
} from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Concurrence sur l'inscription (T4.2/T4.3).
 *
 * « Vérifier puis insérer » est un schéma **racé par nature** : deux requêtes
 * concurrentes passent le contrôle d'existence, puis l'une viole la contrainte
 * d'unicité. Sans traitement explicite, la seconde obtient un **500** — une
 * erreur serveur pour ce qui est un simple conflit d'usage.
 *
 * Ces tests déclenchent réellement la course (requêtes lancées ensemble) plutôt
 * que de simuler une violation de contrainte : c'est la seule façon de vérifier
 * que le comportement observable est bien un 4xx.
 */

jest.setTimeout(90_000);

const TEST_DOMAIN = '@race-test.local';
const PASSWORD = 'un-mot-de-passe-solide-2026';

let provider: AuthProvider;

function email(local: string): string {
  return `${local}${TEST_DOMAIN}`;
}

async function cleanup(): Promise<void> {
  await pool.query(
    `DELETE FROM organizations
     WHERE id IN (SELECT organization_id FROM users WHERE email LIKE $1)`,
    [`%${TEST_DOMAIN}`],
  );
}

describe('inscriptions concurrentes', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    await cleanup();
    provider = getAuthProvider();
  });

  afterAll(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  it('n’accepte qu’une seule inscription pour une même adresse, sans erreur serveur', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const target = email('concurrente');

    // Lancées ensemble : sans le traitement de la violation d'unicité, l'une
    // des deux remonterait une erreur PostgreSQL brute (donc un 500 côté route).
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        provider.register({ email: target, password: PASSWORD, name: 'Course' }),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(4);

    // Chaque échec doit être un conflit d'usage explicite, jamais une erreur
    // technique : aucune ne doit mentionner une contrainte ni un code PostgreSQL.
    for (const failure of failed) {
      expect(failure.reason).toBeInstanceOf(Error);
      expect(failure.reason.message).toMatch(/existe déjà/);
      expect(failure.reason.message).not.toMatch(/duplicate key|23505|constraint/);
    }

    // Une seule organisation et un seul compte ont été créés.
    const { rows } = await pool.query<{ users: string; organizations: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM users WHERE email = $1) AS users,
         (SELECT COUNT(DISTINCT organization_id)::text FROM users WHERE email = $1) AS organizations`,
      [target],
    );
    expect(Number(rows[0].users)).toBe(1);
    expect(Number(rows[0].organizations)).toBe(1);
  });

  it('ne laisse aucune organisation orpheline quand l’inscription échoue', async () => {
    if (!(await requireDatabaseButSkip())) return;

    const target = email('sans-orpheline');
    const name = 'Organisation Éphémère';

    await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        provider.register({ email: target, password: PASSWORD, name }),
      ),
    );

    // Le compte et l'organisation sont créés dans la MÊME transaction : une
    // inscription refusée ne doit pas laisser d'organisation vide derrière elle.
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM organizations
       WHERE name = $1
         AND id NOT IN (SELECT organization_id FROM users)`,
      [name],
    );
    expect(Number(rows[0].count)).toBe(0);
  });

  it('n’accepte qu’une seule connexion Google pour un même compte, sans erreur serveur', async () => {
    if (!(await requireDatabaseButSkip())) return;

    const profile = {
      subject: 'google-sub-race',
      email: email('google-concurrent'),
      name: 'Course Google',
    };

    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () => provider.loginWithGoogle(profile)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    // Au moins une réussite ; les échecs sont des conflits explicites.
    expect(succeeded.length).toBeGreaterThanOrEqual(1);
    for (const failure of failed) {
      expect(failure.reason).toBeInstanceOf(GoogleAccountConflictError);
    }

    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM users WHERE google_id = $1',
      [profile.subject],
    );
    expect(Number(rows[0].count)).toBe(1);
  });
});

/** Alias lisible : évite de répéter la même condition d'infrastructure. */
async function requireDatabaseButSkip(): Promise<boolean> {
  return requireDatabaseOrSkip();
}

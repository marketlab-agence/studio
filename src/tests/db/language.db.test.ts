import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Vérifie que la langue du contenu est bien un attribut de la formation, et
 * qu'il est DISTINCT de la langue d'interface de l'utilisateur.
 *
 * ⚠️ Ce test parle réellement à PostgreSQL (`katalyst_test`). Base injoignable =
 * échec, jamais un report silencieux (`requireDatabaseOrSkip`).
 */
describe('langue du contenu et langue d’interface', () => {
  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  it('donne la langue française aux 6 formations existantes', async () => {
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM courses WHERE language = 'fr'`,
    );
    expect(rows[0].n).toBeGreaterThanOrEqual(6);
  });

  it('refuse une langue non supportée sur une formation', async () => {
    await expect(
      pool.query(`UPDATE courses SET language = 'de' WHERE id = (SELECT id FROM courses LIMIT 1)`),
    ).rejects.toThrow(/courses_language_check/);
  });

  it('accepte une préférence d’interface nulle (non choisie)', async () => {
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM users WHERE language IS NULL`,
    );
    expect(rows[0].n).toBeGreaterThan(0);
  });

  it('refuse une langue d’interface non supportée', async () => {
    await expect(
      pool.query(`UPDATE users SET language = 'de' WHERE id = (SELECT id FROM users LIMIT 1)`),
    ).rejects.toThrow(/users_language_check/);
  });
});

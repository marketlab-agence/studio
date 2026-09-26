import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Vérifie le modèle multi-composants : N composants ordonnés par leçon, le même
 * composant pouvant apparaître deux fois, et la trace rattachée à l'INSTANCE.
 *
 * ⚠️ **Toutes les leçons ont déjà des composants** après la migration 014 (121
 * répartis sur 80 leçons). Le test ajoute donc les siens à des **positions
 * élevées**, pour ne pas entrer en conflit avec `UNIQUE (lesson_id, position)`.
 */
describe('lesson_components', () => {
  beforeAll(async () => {
    await requireDatabaseOrSkip();
  });

  /** N'importe quelle leçon : on ajoute nos composants à des positions libres. */
  async function uneLecon(): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(`SELECT id FROM lessons LIMIT 1`);
    if (rows.length === 0) throw new Error('Aucune leçon : lancer `npm run db:seed`.');
    return rows[0].id;
  }

  afterEach(async () => {
    await pool.query(`DELETE FROM lesson_components WHERE component_name LIKE 'Test%'`);
  });

  it('a bien repris les composants existants (aucun nom vide)', async () => {
    // ⚠️ **On vérifie la QUALITÉ de la reprise, pas un total fixe.** Le nombre de
    // composants dépend de l'état de la base (la base de test est antérieure à la
    // phase 6, où 4 leçons Git ont été converties). Ce qui doit être vrai partout :
    // la table est peuplée, et aucun nom n'est vide.
    const { rows } = await pool.query<{ total: number; noms_vides: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM lesson_components) AS total,
         (SELECT COUNT(*)::int FROM lesson_components
           WHERE component_name IS NULL OR trim(component_name) = '') AS noms_vides`,
    );

    expect(rows[0].total).toBeGreaterThanOrEqual(100);
    expect(rows[0].noms_vides).toBe(0);
  });

  it('accepte le MÊME composant deux fois dans une leçon', async () => {
    const lessonId = await uneLecon();

    await pool.query(
      `INSERT INTO lesson_components (lesson_id, component_name, position)
       VALUES ($1, 'TestRunnerA', 100), ($1, 'TestRunnerA', 101)`,
      [lessonId],
    );

    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM lesson_components
       WHERE lesson_id = $1 AND component_name = 'TestRunnerA'`,
      [lessonId],
    );
    expect(rows[0].n).toBe(2);
  });

  it('refuse deux composants à la même position', async () => {
    const lessonId = await uneLecon();

    await expect(
      pool.query(
        `INSERT INTO lesson_components (lesson_id, component_name, position)
         VALUES ($1, 'TestA', 200), ($1, 'TestB', 200)`,
        [lessonId],
      ),
    ).rejects.toThrow(/lesson_components_lesson_id_position_key/);
  });

  it('ne laisse aucun composant orphelin (cascade)', async () => {
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM lesson_components lc
       WHERE NOT EXISTS (SELECT 1 FROM lessons l WHERE l.id = lc.lesson_id)`,
    );
    expect(rows[0].n).toBe(0);
  });

  it('préserve la trace quand un composant est supprimé', async () => {
    const lessonId = await uneLecon();

    const { rows: comp } = await pool.query<{ id: string }>(
      `INSERT INTO lesson_components (lesson_id, component_name, position)
       VALUES ($1, 'TestTrace', 300) RETURNING id`,
      [lessonId],
    );
    const composantId = comp[0].id;

    const { rows: org } = await pool.query<{ organization_id: string; user_id: string }>(
      `SELECT organization_id, id AS user_id FROM users LIMIT 1`,
    );

    const { rows: trace } = await pool.query<{ id: string }>(
      `INSERT INTO lesson_interactions
         (organization_id, user_id, lesson_id, component_name, kind, payload, lesson_component_id)
       VALUES ($1, $2, $3, 'TestTrace', 'ATTEMPT', '{}'::jsonb, $4) RETURNING id`,
      [org[0].organization_id, org[0].user_id, lessonId, composantId],
    );

    await pool.query(`DELETE FROM lesson_components WHERE id = $1`, [composantId]);

    // ⚠️ La trace SURVIT, avec `lesson_component_id` remis à NULL — et non supprimée.
    const { rows: apres } = await pool.query<{ lesson_component_id: string | null }>(
      `SELECT lesson_component_id FROM lesson_interactions WHERE id = $1`,
      [trace[0].id],
    );
    expect(apres.length).toBe(1);
    expect(apres[0].lesson_component_id).toBeNull();

    await pool.query(`DELETE FROM lesson_interactions WHERE id = $1`, [trace[0].id]);
  });

  it('rend deux instances du même composant dans l’ordre', async () => {
    const lessonId = await uneLecon();
    await pool.query(
      `INSERT INTO lesson_components (lesson_id, component_name, position)
       VALUES ($1, 'TestOrdre', 401), ($1, 'TestOrdre', 400)`,
      [lessonId],
    );

    const { rows } = await pool.query<{ position: number }>(
      `SELECT position FROM lesson_components
       WHERE lesson_id = $1 AND component_name = 'TestOrdre' ORDER BY position`,
      [lessonId],
    );
    expect(rows.map((r) => r.position)).toEqual([400, 401]);
  });

  it('attribue deux traces DISTINCTES à deux instances du MÊME composant', async () => {
    // ⚠️ **Le cœur de la traçabilité par instance (indicateur 19).** Sans
    // `lesson_component_id`, deux `StepByStepRunner` d'une même leçon produiraient
    // des traces indiscernables : l'auditeur ne saurait pas *quelle* occurrence a
    // été travaillée. Ce test relie chaque trace à son instance et vérifie que les
    // deux valeurs sont différentes et non nulles.
    const lessonId = await uneLecon();

    const { rows: org } = await pool.query<{ organization_id: string; user_id: string }>(
      `SELECT organization_id, id AS user_id FROM users LIMIT 1`,
    );
    if (org.length === 0) throw new Error('Aucun utilisateur : lancer `npm run db:seed`.');

    const { rows: composants } = await pool.query<{ id: string }>(
      `INSERT INTO lesson_components (lesson_id, component_name, position)
       VALUES ($1, 'TestTraceMultiple', 500), ($1, 'TestTraceMultiple', 501)
       RETURNING id`,
      [lessonId],
    );

    expect(composants).toHaveLength(2);
    const idsInstances = composants.map((c) => c.id);
    expect(new Set(idsInstances).size).toBe(2);

    const traces: string[] = [];
    for (const instanceId of idsInstances) {
      const { rows } = await pool.query<{ id: string; lesson_component_id: string }>(
        `INSERT INTO lesson_interactions
           (organization_id, user_id, lesson_id, component_name, kind, payload, lesson_component_id)
         VALUES ($1, $2, $3, 'TestTraceMultiple', 'ATTEMPT', '{}'::jsonb, $4)
         RETURNING id, lesson_component_id`,
        [org[0].organization_id, org[0].user_id, lessonId, instanceId],
      );
      expect(rows[0].lesson_component_id).toBe(instanceId);
      traces.push(rows[0].id);
    }

    // Les deux traces pointent vers deux instances différentes : c'est ce qui rend
    // l'attribution opposable en audit.
    const { rows: releve } = await pool.query<{ lesson_component_id: string }>(
      `SELECT DISTINCT lesson_component_id FROM lesson_interactions
       WHERE id = ANY($1::uuid[])`,
      [traces],
    );
    expect(releve).toHaveLength(2);
    expect(releve.map((r) => r.lesson_component_id).sort()).toEqual([...idsInstances].sort());

    // Nettoyage : les traces d'abord (la FK est `ON DELETE SET NULL`).
    await pool.query(`DELETE FROM lesson_interactions WHERE id = ANY($1::uuid[])`, [traces]);
  });
});

import { getAiCreditProvider, InsufficientCreditsError, resetProviders, type OrgScope } from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * AICreditProvider (T3.7).
 *
 * Deux propriétés sont critiques et vérifiées ici :
 *
 * 1. **Aucun solde négatif.** Un débit refusé ne doit rien laisser derrière lui
 *    — ni crédits consommés, ni génération journalisée.
 * 2. **Isolation.** Les crédits appartiennent à l'organisation : recharger ou
 *    consommer depuis une autre organisation n'a aucun effet.
 */

const ORG_B_SLUG = 'credits-org-b';

let scopeA: OrgScope;
let scopeB: OrgScope;

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

  const created = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, slug) VALUES ('Org credits B', $1)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [ORG_B_SLUG],
  );

  const userB = await pool.query<{ id: string }>(
    `INSERT INTO users (organization_id, email, name, role)
     VALUES ($1, 'credits-b@example.com', 'Utilisateur B', 'Utilisateur')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [created.rows[0].id],
  );

  scopeB = {
    organizationId: created.rows[0].id,
    userId: userB.rows[0].id,
    role: 'Utilisateur',
  };
  return true;
}

async function cleanup(): Promise<void> {
  await pool.query('DELETE FROM organizations WHERE slug = $1', [ORG_B_SLUG]);
  await pool.query('DELETE FROM ai_generations WHERE organization_id = $1', [scopeA.organizationId]);
  await pool.query('DELETE FROM ai_credits WHERE organization_id = $1', [scopeA.organizationId]);
}

describe('PostgresAiCreditProvider', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    if (!(await prepare())) throw new Error('Base non seedée.');
  });

  afterEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  function provider() {
    return getAiCreditProvider();
  }

  it('vaut 0 tant qu’aucun crédit n’a été acheté', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await expect(provider().balance(scopeA)).resolves.toBe(0);
  });

  it('recharge le solde, y compris de façon répétée', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    await expect(provider().recharge(scopeA, 100)).resolves.toBe(100);
    await expect(provider().recharge(scopeA, 50)).resolves.toBe(150);
    await expect(provider().balance(scopeA)).resolves.toBe(150);
  });

  it('débite le coût et journalise la génération', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await provider().recharge(scopeA, 100);

    const record = await provider().debit(scopeA, {
      family: 'TTT',
      cost: 30,
      prompt: { subject: 'Introduction à Git' },
      resultRef: 'storage://gen/1.md',
      sourceDocumentIds: [],
    });

    expect(record.family).toBe('TTT');
    expect(record.cost).toBe(30);
    expect(record.userId).toBe(scopeA.userId);
    expect(record.prompt).toEqual({ subject: 'Introduction à Git' });
    expect(await provider().balance(scopeA)).toBe(70);
  });

  it('refuse un débit supérieur au solde et ne laisse aucune trace', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await provider().recharge(scopeA, 20);

    await expect(
      provider().debit(scopeA, { family: 'TTV', cost: 50, prompt: {} }),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);

    // Le solde est intact…
    expect(await provider().balance(scopeA)).toBe(20);
    // …et rien n'a été journalisé : l'opération est tout ou rien.
    expect(await provider().history(scopeA)).toHaveLength(0);
  });

  it('n’accepte pas de descendre le solde sous zéro, même à coût égal', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await provider().recharge(scopeA, 10);

    await provider().debit(scopeA, { family: 'TTS', cost: 10, prompt: {} });
    expect(await provider().balance(scopeA)).toBe(0);

    // Solde à 0 : le moindre débit échoue.
    await expect(
      provider().debit(scopeA, { family: 'TTS', cost: 1, prompt: {} }),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(await provider().balance(scopeA)).toBe(0);
  });

  it('expose le solde et le coût dans le message d’erreur', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await provider().recharge(scopeA, 5);

    await expect(provider().debit(scopeA, { family: 'TTI', cost: 40, prompt: {} })).rejects.toThrow(
      /5 disponible\(s\), 40 demandé\(s\)/,
    );
  });

  it('refuse un coût nul, négatif ou non entier', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await provider().recharge(scopeA, 100);

    for (const cost of [0, -5, 2.5]) {
      await expect(
        provider().debit(scopeA, { family: 'TTT', cost, prompt: {} }),
      ).rejects.toThrow(/Coût de génération invalide/);
    }
  });

  it('refuse une recharge nulle, négative ou non entière', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    for (const credits of [0, -1, 1.5]) {
      await expect(provider().recharge(scopeA, credits)).rejects.toThrow(/Recharge invalide/);
    }
  });

  it('journalise un historique, du plus récent au plus ancien', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await provider().recharge(scopeA, 100);

    await provider().debit(scopeA, { family: 'TTT', cost: 10, prompt: { n: 1 } });
    await provider().debit(scopeA, { family: 'TTI', cost: 20, prompt: { n: 2 } });

    const history = await provider().history(scopeA);

    expect(history).toHaveLength(2);
    expect(history[0].family).toBe('TTI');
    expect(history[0].prompt).toEqual({ n: 2 });
    expect(history[1].family).toBe('TTT');
  });

  it('respecte la limite demandée pour l’historique', async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await provider().recharge(scopeA, 100);
    await provider().debit(scopeA, { family: 'TTT', cost: 1, prompt: { n: 1 } });
    await provider().debit(scopeA, { family: 'TTT', cost: 1, prompt: { n: 2 } });
    await provider().debit(scopeA, { family: 'TTT', cost: 1, prompt: { n: 3 } });

    expect(await provider().history(scopeA, 2)).toHaveLength(2);
  });

  describe('isolation inter-organisations', () => {
    it('ne voit pas les crédits d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider().recharge(scopeA, 500);

      expect(await provider().balance(scopeB)).toBe(0);
    });

    it('ne peut pas consommer les crédits d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider().recharge(scopeA, 500);

      await expect(
        provider().debit(scopeB, { family: 'TTT', cost: 10, prompt: {} }),
      ).rejects.toBeInstanceOf(InsufficientCreditsError);

      // Le solde de A n'a pas bougé.
      expect(await provider().balance(scopeA)).toBe(500);
    });

    it('ne voit pas l’historique d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider().recharge(scopeA, 100);
      await provider().debit(scopeA, { family: 'TTS', cost: 10, prompt: { secret: true } });

      expect(await provider().history(scopeB)).toHaveLength(0);
    });
  });
});

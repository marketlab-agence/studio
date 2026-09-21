import { query, withTransaction } from '@/lib/db/pool';
import { assertScope, type OrgScope } from '../types';
import {
  InsufficientCreditsError,
  type AiCreditProvider,
  type AiGenerationRecord,
  type AiGenerationRequest,
} from '../ai-credits';

type GenerationRow = {
  id: string;
  user_id: string;
  family: AiGenerationRecord['family'];
  prompt: Record<string, unknown>;
  cost: number;
  result_ref: string | null;
  source_document_ids: string[] | null;
  created_at: Date;
};

function toRecord(row: GenerationRow): AiGenerationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    family: row.family,
    prompt: row.prompt ?? {},
    cost: row.cost,
    resultRef: row.result_ref ?? undefined,
    sourceDocumentIds: row.source_document_ids ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Crédits IA en PostgreSQL.
 *
 * Le solde est porté par `ai_credits` (une ligne par organisation, contrainte
 * `CHECK (balance >= 0)`), l'historique par `ai_generations`.
 *
 * RÈGLE D'ISOLATION : `organization_id` figure dans chaque clause WHERE et dans
 * chaque insertion. Une organisation ne peut ni lire, ni consommer, ni
 * recharger les crédits d'une autre.
 */
export class PostgresAiCreditProvider implements AiCreditProvider {
  async balance(scope: OrgScope): Promise<number> {
    const { organizationId } = assertScope(scope);

    // Lecture seule : une instruction, donc pas de transaction (qui
    // monopoliserait une connexion dédiée sans rien apporter).
    const { rows } = await query<{ balance: number }>(
      'SELECT balance FROM ai_credits WHERE organization_id = $1',
      [organizationId],
    );

    // Aucune ligne = aucun crédit acheté, ce qui vaut 0 (et non une erreur).
    return rows[0]?.balance ?? 0;
  }

  async debit(scope: OrgScope, request: AiGenerationRequest): Promise<AiGenerationRecord> {
    const { organizationId, userId } = assertScope(scope);

    if (!Number.isInteger(request.cost) || request.cost <= 0) {
      throw new Error(`Coût de génération invalide : ${request.cost} (entier positif attendu).`);
    }

    return withTransaction(async (client) => {
      // Le retrait est conditionné au solde **dans la même instruction** : deux
      // débits concurrents ne peuvent pas faire passer le solde sous zéro.
      const debit = await client.query<{ balance: number }>(
        `UPDATE ai_credits
         SET balance = balance - $2, updated_at = NOW()
         WHERE organization_id = $1 AND balance >= $2
         RETURNING balance`,
        [organizationId, request.cost],
      );

      if (debit.rowCount === 0) {
        const current = await client.query<{ balance: number }>(
          'SELECT balance FROM ai_credits WHERE organization_id = $1',
          [organizationId],
        );
        throw new InsufficientCreditsError(current.rows[0]?.balance ?? 0, request.cost);
      }

      const inserted = await client.query<GenerationRow>(
        `INSERT INTO ai_generations (
           organization_id, user_id, family, prompt, cost, result_ref, source_document_ids
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, family, prompt, cost, result_ref, source_document_ids, created_at`,
        [
          organizationId,
          userId,
          request.family,
          JSON.stringify(request.prompt ?? {}),
          request.cost,
          request.resultRef ?? null,
          request.sourceDocumentIds ?? null,
        ],
      );

      return toRecord(inserted.rows[0]);
    });
  }

  async recharge(scope: OrgScope, credits: number): Promise<number> {
    const { organizationId } = assertScope(scope);

    if (!Number.isInteger(credits) || credits <= 0) {
      throw new Error(`Recharge invalide : ${credits} (entier positif attendu).`);
    }

    const { rows } = await query<{ balance: number }>(
      `INSERT INTO ai_credits (organization_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (organization_id) DO UPDATE SET
         balance = ai_credits.balance + $2, updated_at = NOW()
       RETURNING balance`,
      [organizationId, credits],
    );

    return rows[0].balance;
  }

  async history(scope: OrgScope, limit = 50): Promise<AiGenerationRecord[]> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<GenerationRow>(
      `SELECT id, user_id, family, prompt, cost, result_ref, source_document_ids, created_at
       FROM ai_generations
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [organizationId, limit],
    );

    return rows.map(toRecord);
  }
}

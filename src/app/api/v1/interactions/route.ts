import { NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { interactionRecordSchema } from '@/lib/schemas/interaction';
import { enforceRateLimit, errorResponse, parseBody, requireSession, scopeFromClaims } from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/v1/interactions — enregistre une interaction pédagogique.
 *
 * Fondement : **indicateur 19** du RNQ V10 — *« vérifie l'effectivité du suivi »* des modules
 * à distance. C'est cette route qui produit les **traces opposables en audit**.
 *
 * ⚠️ **Les échecs sont acceptés, et c'est voulu.** Une tentative ratée est l'information la
 * plus utile pour l'encadrant : elle montre *où* l'apprenant bloque. Refuser de la tracer
 * priverait le suivi de sa valeur pédagogique.
 *
 * ⚠️ L'identifiant d'utilisateur vient **du jeton**, jamais du corps : l'accepter permettrait
 * d'attribuer ses propres interactions à un autre apprenant — ou l'inverse.
 */
export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  // Une interaction par étape peut être fréquente : la limite est large, mais elle existe
  // pour qu'un client emballé ne martèle pas la base.
  const limited = enforceRateLimit(request, 'interaction-record', RATE_LIMITS.refresh);
  if (limited) return limited;

  const body = await parseBody(request, interactionRecordSchema);
  if (body.response) return body.response;

  const { organizationId, userId } = scopeFromClaims(session.claims);

  try {
    // La leçon doit appartenir à l'organisation : sans ce contrôle, on écrirait des traces
    // rattachées au contenu d'une autre organisation.
    const owner = await query<{ id: string }>(
      `SELECT l.id FROM lessons l
       JOIN chapters ch ON ch.id = l.chapter_id
       JOIN courses co ON co.id = ch.course_id
       WHERE co.organization_id = $1 AND l.id = $2`,
      [organizationId, body.data.lessonId],
    );

    if (owner.rows.length === 0) {
      return errorResponse(
        'Leçon introuvable dans cette organisation : trace refusée.',
        403,
      );
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO lesson_interactions (
         organization_id, user_id, lesson_id, component_name, kind, payload, outcome, duration_seconds
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        organizationId,
        userId,
        body.data.lessonId,
        body.data.componentName,
        body.data.kind,
        JSON.stringify(body.data.payload ?? {}),
        body.data.outcome ?? null,
        // `null` et non 0 : une durée non mesurée n'est pas une durée nulle.
        body.data.durationSeconds ?? null,
      ],
    );

    return NextResponse.json({ recorded: true, id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('[interactions] POST — échec :', error);
    return errorResponse('Impossible d’enregistrer l’interaction.', 500);
  }
}

export async function GET() {
  return errorResponse('Méthode non autorisée : utiliser POST.', 405);
}

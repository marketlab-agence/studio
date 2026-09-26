'use client';

import { useCallback, useRef } from 'react';
import type { InteractionKind, InteractionOutcome } from '@/lib/schemas/interaction';

/**
 * Enregistre les interactions d'un apprenant avec un composant pédagogique.
 *
 * ⚠️ **C'est la pièce qui rend l'indicateur 19 vérifiable.** Le décret exige de *« vérifier
 * l'effectivité du suivi »* des modules à distance, et les relevés de connexion ne suffisent
 * plus. Ce hook produit les traces d'appropriation : réponse donnée, issue, durée.
 *
 * ⚠️ **Aucune donnée n'est inventée.** Si la durée n'est pas mesurée, elle n'est pas envoyée
 * (`null`), jamais remplacée par 0 — ce serait une donnée fausse.
 *
 * ⚠️ **L'échec d'enregistrement n'interrompt pas le parcours.** L'apprenant doit pouvoir
 * continuer même si le réseau vacille ; sa progression locale reste juste et la trace manquante
 * se verra en audit — ce qui est préférable à un parcours bloqué.
 */

export interface RecordStepInput {
  /** Identifiant de l'étape au sein du composant. */
  stepId?: string;
  kind?: InteractionKind;
  outcome?: InteractionOutcome;
  /** Données propres au composant (réponse, étapes, écart…). */
  payload?: Record<string, unknown>;
}

export interface UseLessonTraceOptions {
  lessonId: string;
  /** Nom du composant du registre qui produit la trace. */
  componentName: string;
  /**
   * Identifiant de l'**instance** de composant (`lesson_components.id`).
   *
   * ⚠️ **Facultatif** : une leçon non persistée (ou un rendu hors leçon) n'en a pas.
   * Quand il est fourni, la trace est attribuée à l'instance exacte — c'est ce qui
   * distingue deux occurrences du même composant dans une même leçon.
   */
  lessonComponentId?: string;
}

export function useLessonTrace({ lessonId, componentName, lessonComponentId }: UseLessonTraceOptions) {
  // Horodatage du début : sert à mesurer la durée d'interaction sans dépendre du serveur.
  const startedAt = useRef<number>(Date.now());

  const send = useCallback(
    (body: {
      kind: InteractionKind;
      outcome?: InteractionOutcome;
      payload: Record<string, unknown>;
      durationSeconds?: number;
    }) => {
      // `keepalive` : la requête aboutit même si l'apprenant quitte la page juste après
      // avoir validé une étape — cas fréquent et coûteux en traces perdues.
      return fetch('/api/v1/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify({
          lessonId,
          componentName,
          // Omis quand absent : le serveur insère `NULL`, et les traces historiques
          // restent valides (attribution à l'instance rendue **optionnelle**).
          ...(lessonComponentId ? { lessonComponentId } : {}),
          ...body,
        }),
      }).catch((error) => {
        // Journalisé, jamais propagé : l'apprenant ne doit pas voir une erreur technique
        // pour un enregistrement de trace.
        console.warn('[useLessonTrace] trace non enregistrée :', error);
      });
    },
    [lessonId, componentName, lessonComponentId],
  );

  /**
   * Enregistre la validation d'une étape (réussie ou non).
   *
   * ⚠️ **Les échecs sont tracés aussi.** C'est même l'information la plus utile pour
   * l'encadrant : elle montre *où* l'apprenant bloque. Ne tracer que les réussites priverait
   * le suivi de sa valeur pédagogique.
   */
  const recordStep = useCallback(
    (input: RecordStepInput) => {
      const kind: InteractionKind = input.kind ?? 'STEP_COMPLETED';

      return send({
        kind,
        outcome: input.outcome,
        payload: {
          stepId: input.stepId ?? null,
          ...input.payload,
        },
      });
    },
    [send],
  );

  /** Enregistre la durée totale d'interaction (mesure directe de l'effectivité). */
  const recordDuration = useCallback(() => {
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);

    // Un temps nul n'est pas une mesure : on ne l'envoie pas. Mieux vaut une trace sans
    // durée qu'une durée fausse.
    if (seconds <= 0) return Promise.resolve();

    return send({
      kind: 'ATTEMPT',
      payload: {},
      durationSeconds: seconds,
    });
  }, [send]);

  /** Enregistre une production libre (rédaction, construction). */
  const recordProduction = useCallback(
    (payload: Record<string, unknown>) =>
      send({ kind: 'FREE_TEXT', payload }),
    [send],
  );

  /** Réinitialise le chronomètre (reprise d'une procédure depuis le début). */
  const restartTimer = useCallback(() => {
    startedAt.current = Date.now();
  }, []);

  return { recordStep, recordDuration, recordProduction, restartTimer };
}

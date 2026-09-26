import { z } from 'zod';

/**
 * Schémas du journal d'interaction — fondement : **indicateur 19** du RNQ V10.
 *
 * Le décret exige de *« vérifier l'effectivité du suivi »* des modules à distance. Ces
 * schémas définissent **ce qui est tracé** — donc ce qui sera opposable en audit.
 *
 * Voir `@docs/katalyst/conformite-rnq-v10.md` et la migration 012.
 */

/** Nature de l'interaction. Liste volontairement large : les 12 primitives produisent des traces différentes. */
export const INTERACTION_KINDS = [
  'STEP_COMPLETED',
  'ATTEMPT',
  'ANSWER',
  'FREE_TEXT',
  'REVISION',
] as const;

export type InteractionKind = (typeof INTERACTION_KINDS)[number];

/** Issue de l'interaction, quand elle est évaluable. */
export const INTERACTION_OUTCOMES = ['SUCCESS', 'PARTIAL', 'FAILURE'] as const;

export type InteractionOutcome = (typeof INTERACTION_OUTCOMES)[number];

export const interactionRecordSchema = z.object({
  /** Identifiant de la leçon — le composant le connaît, l'appelant aussi. */
  lessonId: z.string().trim().min(1).max(200),

  /** Nom du composant du registre. Permet de savoir *comment* l'apprenant s'est approprié. */
  componentName: z.string().trim().min(1).max(120),

  /**
   * Instance de composant visée (`lesson_components.id`).
   *
   * ⚠️ **Facultative.** Les traces antérieures et les rendus hors leçon n'en ont pas :
   * l'imposer casserait la compatibilité. Quand elle est présente, elle attribue la
   * trace à *l'instance* — indispensable dès que le même composant apparaît deux fois.
   */
  lessonComponentId: z.string().uuid().optional(),

  kind: z.enum(INTERACTION_KINDS),

  outcome: z.enum(INTERACTION_OUTCOMES).optional(),

  /** Données propres au composant : réponse, étapes, écart… */
  payload: z.record(z.unknown()).default({}),

  /**
   * Durée d'interaction en secondes.
   *
   * ⚠️ **Optionnelle, et jamais 0 par défaut.** Une durée non mesurée reste absente : mettre 0
   * serait une donnée inventée, ce que la méthode REWORK interdit. La borne haute (24 h) évite
   * qu'un onglet laissé ouvert ne produise une mesure absurde qui fausserait les statistiques.
   */
  durationSeconds: z.number().int().positive().max(86_400).optional(),
});

export type InteractionRecordInput = z.infer<typeof interactionRecordSchema>;

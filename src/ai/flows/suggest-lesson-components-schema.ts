import { z } from 'zod';
import { BLOOM_LEVELS } from '@/lib/content/bloom';
import { ComponentConfigSchema } from '@/lib/schemas/component-config';

/**
 * Schémas du flux de suggestion de composants — isolés du fichier du flux.
 *
 * ⚠️ **Pourquoi un module dédié.** `suggest-lesson-components-flow.ts` commence par
 * `'use server'` : Next.js y interdit toute exportation qui n'est pas une fonction
 * asynchrone. Or les tests doivent vérifier la **forme** des schémas (sortie en tableau,
 * entrée acceptant `bloomLevel`) **sans invoquer l'IA**. Ce module, sans `'use server'`,
 * expose donc les schémas à l'import.
 */

export const SuggestLessonComponentsInputSchema = z.object({
  lessonTitle: z.string().describe('Le titre de la leçon.'),
  lessonObjective: z.string().describe("L'objectif d'apprentissage de la leçon."),
  courseTopic: z.string().describe('Le sujet principal de la formation.'),
  targetAudience: z.string().describe('Le public visé par la formation.'),
  courseLanguage: z
    .string()
    .optional()
    .describe('La langue de la formation — justifications ET libellés produits dans cette langue.'),
  illustrativeContent: z
    .string()
    .describe('Le contenu Markdown de la leçon, analysé pour proposer des composants pertinents.'),
  availableInteractiveComponents: z
    .array(z.string())
    .describe('Interactifs admissibles — déjà filtrés par l’appelant pour couvrir le niveau visé.'),
  availableVisualComponents: z
    .array(z.string())
    .describe('Visuels admissibles — illustratifs, sans contrainte de niveau.'),
  /**
   * Niveau visé, transmis au prompt pour rappeler le cadre pédagogique.
   *
   * ⚠️ Le **filtrage** n'est pas fait par l'IA : l'appelant ne lui transmet que des
   * interactifs couvrant ce niveau. Le champ ne sert qu'à contextualiser la rédaction.
   */
  bloomLevel: z
    .enum(BLOOM_LEVELS)
    .optional()
    .describe('Le niveau de Bloom visé par la leçon.'),
});
export type SuggestLessonComponentsInput = z.infer<typeof SuggestLessonComponentsInputSchema>;

/** Un composant proposé par l'IA : nom exact, configuration et justification. */
export const SuggestedLessonComponentSchema = z.object({
  name: z.string().describe('Nom EXACT d’un composant de la liste fournie.'),
  config: ComponentConfigSchema,
  justification: z.string(),
});

export const SuggestLessonComponentsOutputSchema = z.object({
  components: z
    .array(SuggestedLessonComponentSchema)
    .describe(
      'Entre 0 et N composants. Vise 2 quand c’est pédagogiquement pertinent ; ' +
        '0 est acceptable pour une leçon purement notionnelle.',
    ),
});
export type SuggestLessonComponentsOutput = z.infer<typeof SuggestLessonComponentsOutputSchema>;

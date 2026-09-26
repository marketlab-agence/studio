
'use server';
/**
 * @fileOverview Flux de suggestion des composants pédagogiques d'une leçon.
 *
 * - suggestLessonComponents - Propose 0 à N composants, avec leur configuration.
 * - SuggestLessonComponentsInput / Output - Types définis dans `suggest-lesson-components-schema.ts`.
 *
 * ⚠️ **Les schémas vivent dans un module à part.** Ce fichier est `'use server'` : Next.js y
 * n'autorise que des exportations de fonctions asynchrones. Les schémas, eux, doivent être
 * importables par les tests — d'où `suggest-lesson-components-schema.ts`.
 */

import { ai } from '@/ai/genkit';
import {
  SuggestLessonComponentsInputSchema,
  SuggestLessonComponentsOutputSchema,
  type SuggestLessonComponentsInput,
  type SuggestLessonComponentsOutput,
} from './suggest-lesson-components-schema';

export type {
  SuggestLessonComponentsInput,
  SuggestLessonComponentsOutput,
} from './suggest-lesson-components-schema';

const suggestLessonComponentsPrompt = ai.definePrompt({
  name: 'suggestLessonComponentsPrompt',
  input: { schema: SuggestLessonComponentsInputSchema },
  output: { schema: SuggestLessonComponentsOutputSchema },
  prompt: `Tu es un concepteur pédagogique expert et exigeant. Analyse le contenu fourni et propose des composants pédagogiques UNIQUEMENT s'ils sont réellement utiles, en justifiant chaque proposition par une référence précise au contenu.

**1. Analyser le contenu :**

*   **Sujet du cours :** {{{courseTopic}}}
*   **Titre de la leçon :** {{{lessonTitle}}}
*   **Objectif de la leçon :** {{{lessonObjective}}}
*   **Langue de la formation (justifications ET libellés) :** {{#if courseLanguage}}{{{courseLanguage}}}{{else}}Français{{/if}}
*   **Niveau de Bloom visé par la leçon :** {{bloomLevel}}
*   **Contenu de la leçon (Markdown) :**
    ---
    {{{illustrativeContent}}}
    ---

**2. Démarche :**

*   **La justification d'abord.** Pour chaque composant, écris pourquoi il est nécessaire et quelle partie du contenu le soutient.
*   **Composants INTERACTIFS :** ils sont déjà filtrés pour couvrir le niveau de Bloom visé. N'en choisis un (ou plusieurs) que s'il existe une compétence pratique à exercer.
*   **Composants VISUELS :** ils sont purement illustratifs, **sans contrainte de niveau**. Choisis-les pour leur **pertinence illustrative** — rendre la leçon immédiatement lisible — et ne les écarte pas faute de niveau de Bloom.
*   **Vérification de pertinence :** le composant doit se rapporter au **sujet du cours : {{{courseTopic}}}**. Ne propose pas de composant Git pour une formation de vente.
*   **Si aucune justification solide n'existe, ne propose rien.** Mieux vaut zéro composant qu'un composant hors sujet.

**3. Composants INTERACTIFS admissibles** (ils couvrent le niveau ci-dessus) :
{{#each availableInteractiveComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

**Composants VISUELS admissibles** (illustratifs — choisis-les pour rendre la
leçon immédiatement lisible, sans contrainte de niveau) :
{{#each availableVisualComponents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

**4. Générer la réponse selon le schéma de sortie.** Entre 0 et N composants. Vise 2 quand c'est pédagogiquement pertinent ; 0 est acceptable pour une leçon purement notionnelle. Pour chaque composant : son nom EXACT issu des listes ci-dessus, sa \`config\` (\`labels\` rédigés dans la langue de la formation, et \`data\` si des données structurées sont nécessaires) et sa justification.
`,
});

const suggestLessonComponentsFlow = ai.defineFlow(
  {
    name: 'suggestLessonComponentsFlow',
    inputSchema: SuggestLessonComponentsInputSchema,
    outputSchema: SuggestLessonComponentsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestLessonComponentsPrompt(input);
    return output!;
  },
);

export async function suggestLessonComponents(
  input: SuggestLessonComponentsInput,
): Promise<SuggestLessonComponentsOutput> {
  return suggestLessonComponentsFlow(input);
}

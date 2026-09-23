
'use server';
/**
 * @fileOverview An AI flow for generating structured lesson content.
 *
 * - generateLessonContent - A function that generates Markdown content and suggests components for a lesson.
 * - GenerateLessonContentInput - The input type for the function.
 * - GenerateLessonContentOutput - The return type for the function is defined in tutorial.types.ts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateLessonContentOutput } from '@/types/tutorial.types';
import { generateLessonMarkdown } from './generate-lesson-markdown-flow';
import { suggestLessonComponents } from './suggest-lesson-components-flow';


const GenerateLessonContentInputSchema = z.object({
  lessonTitle: z.string().describe("The title of the lesson to generate."),
  lessonObjective: z.string().describe("The learning objective for the lesson."),
  courseTopic: z.string().describe("The main topic of the entire course for context."),
  targetAudience: z.string().describe("The target audience for the course."),
  courseLanguage: z.string().optional().describe("The language for the lesson content."),
  chapterContext: z.string().describe("The titles and objectives of other lessons in the same chapter to provide context and the full course plan to give global context."),
  lessonLength: z.enum(['Court', 'Moyen', 'Long']).optional().describe("The desired length for the lesson content. 'Court' for a summary, 'Moyen' for standard detail, 'Long' for an in-depth explanation."),
  availableInteractiveComponents: z.array(z.string()).describe("A list of available interactive React components to choose from."),
  availableVisualComponents: z.array(z.string()).describe("A list of available data visualization React components to choose from."),
  /**
   * Niveau de Bloom visé par l'objectif.
   *
   * ⚠️ **Indispensable à la conformité** (indicateur 11 du RNQ) : sans niveau déclaré, on ne
   * peut pas vérifier que l'évaluation proposée est à la hauteur de l'objectif. Il est donc
   * transmis à l'IA, qui doit choisir un composant **cohérent** avec lui.
   *
   * Optionnel pour ne pas casser les appelants existants : sans niveau, le comportement
   * antérieur est conservé (le catalogue entier, filtré par domaine).
   */
  bloomLevel: z
    .enum(['Connaître', 'Comprendre', 'Appliquer', 'Analyser', 'Évaluer', 'Créer'])
    .optional()
    .describe('Le niveau de Bloom visé par la leçon. Détermine la nature de la mise en pratique attendue.'),
});
export type GenerateLessonContentInput = z.infer<typeof GenerateLessonContentInputSchema>;

const GenerateLessonContentOutputSchema = z.object({
  illustrativeContent: z.string().describe("The main educational content for the lesson in well-structured Markdown format. It should include headings, lists, code blocks, and bold text to explain the concepts clearly."),
  interactiveComponentName: z.string().optional().describe("The name of a single, most relevant interactive component selected from the provided list that would provide a hands-on experience. If no component is relevant, this field can be omitted."),
  visualComponentName: z.string().optional().describe("The name of a single, most relevant visualization component selected from the provided list that would help illustrate a key concept. If no component is relevant, this field can be omitted."),
  /**
   * Niveau de Bloom **confirmé** par l'IA après rédaction.
   *
   * L'IA peut constater que le contenu effectivement produit ne correspond pas au niveau visé
   * — par exemple un objectif « Créer » traité comme une simple explication. Le signaler vaut
   * mieux que de laisser une incohérence silencieuse que l'audit découvrirait plus tard.
   */
  bloomLevelUsed: z
    .enum(['Connaître', 'Comprendre', 'Appliquer', 'Analyser', 'Évaluer', 'Créer'])
    .optional()
    .describe('Le niveau de Bloom effectivement couvert par le contenu produit.'),
});

const generateLessonContentFlow = ai.defineFlow(
  {
    name: 'generateLessonContentFlow',
    inputSchema: GenerateLessonContentInputSchema,
    outputSchema: GenerateLessonContentOutputSchema,
  },
  async (input) => {
    // Étape 1 : Générer le contenu Markdown.
    const markdownOutput = await generateLessonMarkdown({
      lessonTitle: input.lessonTitle,
      lessonObjective: input.lessonObjective,
      courseTopic: input.courseTopic,
      targetAudience: input.targetAudience,
      courseLanguage: input.courseLanguage,
      chapterContext: input.chapterContext,
      lessonLength: input.lessonLength,
    });

    const { illustrativeContent } = markdownOutput;

    // Étape 2 : Suggérer des composants basés sur le contenu généré.
    const componentSuggestions = await suggestLessonComponents({
        lessonTitle: input.lessonTitle,
        lessonObjective: input.lessonObjective,
        courseTopic: input.courseTopic,
        targetAudience: input.targetAudience,
        courseLanguage: input.courseLanguage,
        illustrativeContent,
        availableInteractiveComponents: input.availableInteractiveComponents,
        availableVisualComponents: input.availableVisualComponents,
    });

    return {
        illustrativeContent,
        interactiveComponentName: componentSuggestions.interactiveComponentName,
        visualComponentName: componentSuggestions.visualComponentName,
    };
  }
);


export async function generateLessonContent(input: GenerateLessonContentInput): Promise<GenerateLessonContentOutput> {
  return generateLessonContentFlow(input);
}

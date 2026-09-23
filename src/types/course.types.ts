
import { type CreateCourseInput, type CreateCourseOutput } from '@/ai/flows/create-course-flow';

export interface CourseInfo {
  id: string;
  title: string;
  description: string;
  status: 'Publié' | 'Brouillon' | 'Plan';
  plan?: CreateCourseOutput;
  generationParams?: CreateCourseInput;
  /**
   * Domaine de contenu, pour filtrer les composants proposés à l'IA.
   *
   * ⚠️ **Champ explicite** (migration 010) et non déduit : une heuristique par mots-clés
   * se trompe sur les cas mixtes (« Git pour les commerciaux » contient les deux).
   * `null` = non déterminé, donc aucun filtrage.
   */
  contentDomain?: string | null;
}

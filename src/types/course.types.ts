
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
    /**
     * Langue du contenu, choisie par son créateur.
     *
     * ⚠️ **Ce n'est PAS une traduction.** Une formation porte **une** langue ; il
     * n'existe pas « la même formation en FR et EN ». L'interface suit la langue de
     * l'utilisateur, le contenu celle de son créateur — les deux sont indépendants.
     */
    language: 'fr' | 'en' | 'es';
  }

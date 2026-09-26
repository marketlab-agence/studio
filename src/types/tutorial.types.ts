






import type { ComponentConfig } from '@/lib/schemas/component-config';

export interface Tutorial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  objective: string;
  content: string; // Illustrative markdown content
  /**
   * Composants pédagogiques, **ordonnés**.
   *
   * ⚠️ **Une liste, pas deux emplacements.** Le même composant peut apparaître
   * plusieurs fois (deux procédures, deux quiz) : c'est la `position` qui définit
   * l'enchaînement.
   *
   * ⚠️ **La nature (`interactive`/`visual`) vient du catalogue**, jamais de la
   * donnée — sinon deux vérités pourraient diverger.
   */
  components: LessonComponent[];
  /**
   * Champs lus en base, exposés pour que la lecture soit **fidèle**.
   *
   * ⚠️ Ils sont **en lecture seule** du point de vue du provider : `type`/`points` sont
   * initialisés à la création et préservés en mise à jour (absents du `DO UPDATE`), et
   * `position` est recalculée depuis l'ordre du tableau. Les exposer ne change donc pas
   * l'écriture — cela rend seulement la leçon relue conforme à ce qui est stocké.
   */
  type?: string;
  points?: number;
  position?: number;
  /**
   * Niveau de Bloom visé par l'objectif de cette leçon.
   *
   * ⚠️ `undefined` signifie **« à compléter »**, jamais « aucun niveau » : la conformité
   * (indicateur 11 du RNQ) exige un niveau déclaré. L'audit signale les manquants
   * (`@docs/katalyst/regles-conformite.md`, règle R6).
   */
  bloomLevel?: string;
}

/** Une instance de composant dans une leçon : son nom, sa place, sa configuration. */
export interface LessonComponent {
  /**
   * Identifiant de l'**instance** en base (`lesson_components.id`).
   *
   * ⚠️ **Optionnel** : une leçon non encore persistée n'en a pas, et les traces
   * existantes restent valides (`lesson_component_id` vaut alors `NULL`). C'est
   * cet `id` qui permet d'attribuer une trace à *l'instance* qui l'a produite —
   * et donc de distinguer deux occurrences du même composant dans une leçon.
   */
  id?: string;
  name: string;
  position: number;
  config?: {
    /** Libellés propres à cette instance, dans la langue de la formation. */
    labels?: Record<string, string>;
    /** Données structurées, validées par le schéma du composant (catalogue). */
    data?: unknown;
  };
}

export interface Quiz {
    id: string;
    title: string;
    questions: Question[];
    passingScore: number;
    feedbackTiming?: 'immediate' | 'end';
}

export interface Question {
    id:string;
    text: string;
    answers: Answer[];
    isMultipleChoice?: boolean;
}

export interface Answer {
    id: string;
    text: string;
    isCorrect?: boolean;
}

export interface CourseProgress {
  quizScores: Record<string, number>;
  quizAttempts: Record<string, number>;
  completedLessons: Set<string>;
  currentChapterId: string | null;
  currentLessonId: string | null;
  currentView: 'lesson' | 'quiz';
  quizAnswers: Record<string, Record<string, string[]>>;
}

export type GlobalProgress = Record<string, CourseProgress>;

/**
 * Progression d'un apprenant sur un tutoriel, au niveau des étapes.
 * Utilisé par la couche de requêtes React Query et les utilitaires de progression.
 */
export interface UserProgress {
  completedSteps: Set<string>;
  currentStepId: string | null;
}

/** Un composant proposé par l'IA pour une leçon, **avant** persistance. */
export type GeneratedLessonComponent = {
  name: string;
  config?: ComponentConfig;
  /** Pourquoi ce composant sert l'objectif — affiché au formateur, non persisté. */
  justification: string;
};

export type GenerateLessonContentOutput = {
  illustrativeContent: string;
  /**
   * Composants proposés, ordonnés. **Peut être vide** : une leçon purement notionnelle
   * n'exige aucune mise en pratique ni illustration.
   */
  components: GeneratedLessonComponent[];
};

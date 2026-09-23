






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
  interactiveComponentName?: string;
  visualComponentName?: string;
  /**
   * Niveau de Bloom visé par l'objectif de cette leçon.
   *
   * ⚠️ `undefined` signifie **« à compléter »**, jamais « aucun niveau » : la conformité
   * (indicateur 11 du RNQ) exige un niveau déclaré. L'audit signale les manquants
   * (`@docs/katalyst/regles-conformite.md`, règle R6).
   */
  bloomLevel?: string;
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

export type GenerateLessonContentOutput = {
  illustrativeContent: string;
  interactiveComponentName?: string;
  visualComponentName?: string;
};

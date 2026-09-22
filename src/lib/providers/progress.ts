import type { OrgScope } from './types';

/**
 * Progression d'un apprenant (REQ-PROG-01, REQ-PROG-02).
 *
 * Deux niveaux, volontairement distincts :
 *
 * - `user_lesson_progress` — **ce qui est terminé**. Une ligne par leçon
 *   accomplie. C'est cette table qui porte la gamification et les statistiques ;
 * - `user_course_progress` — **où l'on en est**. Scores de quiz, réponses,
 *   dernière position. Une ligne par formation et par apprenant.
 *
 * La séparation n'est pas cosmétique : on peut avoir terminé une leçon sans
 * jamais avoir ouvert de quiz, et réciproquement. Les fusionner obligerait à
 * inventer une ligne de progression pour chaque leçon.
 */

/** Progression d'un apprenant sur **une** formation. */
export interface CourseProgress {
  /** Identifiants des leçons terminées. */
  completedLessons: Set<string>;
  /** Score obtenu par chapitre (identifiant de chapitre → pourcentage). */
  quizScores: Record<string, number>;
  /** Nombre de tentatives par chapitre. */
  quizAttempts: Record<string, number>;
  /** Réponses données par chapitre : chapitre → question → réponses choisies. */
  quizAnswers: Record<string, Record<string, string[]>>;
  /** Dernier chapitre consulté, pour reprendre au bon endroit. */
  currentChapterId: string | null;
  /** Dernière leçon consultée. */
  currentLessonId: string | null;
  /** Dernière vue : leçon ou quiz. */
  currentView: 'lesson' | 'quiz';
}

/** Progression de l'apprenant, indexée par identifiant de formation. */
export type GlobalProgress = Record<string, CourseProgress>;

/** Progression vierge d'une formation. */
export function emptyCourseProgress(): CourseProgress {
  return {
    completedLessons: new Set(),
    quizScores: {},
    quizAttempts: {},
    quizAnswers: {},
    currentChapterId: null,
    currentLessonId: null,
    currentView: 'lesson',
  };
}

/** Point de reprise, tel qu'il est enregistré. */
export interface ResumePoint {
  chapterId: string | null;
  lessonId: string | null;
  view: 'lesson' | 'quiz';
}

export interface ProgressProvider {
  /**
   * Progression de l'apprenant de la session, **toutes formations confondues**.
   *
   * Une seule requête pour l'ensemble : le client a besoin de l'ensemble pour
   * afficher les tableaux de bord et les pourcentages. Interroger formation par
   * formation multiplierait les allers-retours.
   */
  getAll(scope: OrgScope): Promise<GlobalProgress>;

  /**
   * Enregistre la progression d'**une** formation.
   *
   * Les leçons terminées sont synchronisées avec `user_lesson_progress` :
   * ajoutées, et **retirées** si elles ne figurent plus. Sans ce retrait, une
   * leçon décochée resterait comptée comme terminée en base — l'affichage et la
   * réalité divergeraient.
   */
  saveCourse(scope: OrgScope, courseId: string, progress: CourseProgress): Promise<void>;

  /**
   * Vérifie qu'une leçon appartient bien à l'organisation de l'apprenant.
   * Utilisé pour refuser une progression sur un contenu d'une autre organisation.
   */
  lessonBelongsToOrganization(scope: OrgScope, lessonId: string): Promise<boolean>;
}

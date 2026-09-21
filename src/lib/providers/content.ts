import type { CourseInfo } from '@/types/course.types';
import type { Lesson, Quiz } from '@/types/tutorial.types';
import type { SubscriptionPlan } from '@/types/plans.types';
import type { OrgScope } from './types';

/**
 * Chapitre tel que consommé par l'application : un chapitre et ses leçons.
 * Correspond à l'ancien document « tutorial » de Firestore.
 */
export interface ChapterWithLessons {
  id: string;
  courseId: string;
  title: string;
  description: string;
  /** Regroupement facultatif (ex. « Semaine 1 ») — intitulé libre. */
  weekId: string | null;
  position: number;
  unlockRuleId: string | null;
  lessons: Lesson[];
}

/**
 * Accès au contenu pédagogique (formations, chapitres, leçons, quiz, formules).
 *
 * ⚠️ Aucune méthode ne peut être appelée sans `scope` : l'isolation entre
 * organisations en dépend (ADR 0007).
 */
export interface ContentProvider {
  // --- Formations -----------------------------------------------------------
  listCourses(scope: OrgScope): Promise<CourseInfo[]>;
  getCourse(scope: OrgScope, id: string): Promise<CourseInfo | null>;
  saveCourses(scope: OrgScope, courses: CourseInfo[]): Promise<void>;
  createCourse(scope: OrgScope, course: Omit<CourseInfo, 'id'>): Promise<CourseInfo>;
  updateCourse(scope: OrgScope, id: string, changes: Partial<CourseInfo>): Promise<void>;
  deleteCourse(scope: OrgScope, id: string): Promise<void>;

  // --- Chapitres et leçons ---------------------------------------------------
  listChapters(scope: OrgScope, courseId?: string): Promise<ChapterWithLessons[]>;
  getChapter(scope: OrgScope, id: string): Promise<ChapterWithLessons | null>;
  saveChapters(scope: OrgScope, chapters: ChapterWithLessons[]): Promise<void>;
  deleteChapter(scope: OrgScope, id: string): Promise<void>;

  // --- Quiz ------------------------------------------------------------------
  /** Quiz indexés par identifiant de chapitre (forme attendue par l'application). */
  listQuizMap(scope: OrgScope): Promise<Record<string, Quiz>>;
  getQuiz(scope: OrgScope, id: string): Promise<Quiz | null>;
  saveQuizMap(scope: OrgScope, quizzes: Record<string, Quiz>): Promise<void>;
  deleteQuiz(scope: OrgScope, id: string): Promise<void>;

  // --- Formules --------------------------------------------------------------
  listPlans(scope: OrgScope): Promise<SubscriptionPlan[]>;
}

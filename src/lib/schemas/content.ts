import { z } from 'zod';

/**
 * Modèle de contenu de Katalyst — **source unique des contrats**.
 *
 * Hiérarchie : Formation → [regroupement libre] → Chapitre → Leçon (+ Quiz).
 *
 * ⚠️ « S » et « J » dans les intitulés ne sont PAS des données.
 * Le formateur titre librement les regroupements, chapitres et leçons : il
 * peut y écrire « S1.J2 » s'il le souhaite, mais aucune colonne ne porte de code
 * `S.n.J.m`, et aucune règle « 1 leçon = 1 jour » n'existe — **une leçon peut
 * couvrir plusieurs jours**.
 *
 * L'ORGANISATION DU RYTHME (accès par période, comme dans REWORK) passe par
 * `UnlockRuleSchema`, applicable à la formation, au chapitre ou à la leçon.
 *
 * ⚠️ Ce module ne doit PAS importer le catalogue de composants (qui embarque des
 * composants React) : un schéma partagé peut être importé côté client, et
 * tirerait les 46 composants dans le bundle. La validation des noms de
 * composants se fait séparément, à la création (`assertKnownComponent`).
 */

// --- Types de leçon ----------------------------------------------------------

export const LESSON_TYPES = [
  'VIDEO',
  'AUDIO',
  'CAPSULE',
  'MISE_EN_PRATIQUE',
  'EVALUATION',
  'TEXTE',
  'IMAGE',
  'MEDIA',
  'LIEN',
] as const;

export const LessonTypeSchema = z.enum(LESSON_TYPES);
export type LessonType = z.infer<typeof LessonTypeSchema>;

/** Famille de média référencée par une leçon. */
export const MEDIA_PROVIDERS = ['youtube', 'vevo', 'image', 'audio', 'file', 'external'] as const;
export const MediaProviderSchema = z.enum(MEDIA_PROVIDERS);
export type MediaProvider = z.infer<typeof MediaProviderSchema>;

export const MediaRefSchema = z.object({
  provider: MediaProviderSchema,
  url: z.string().url(),
  /** Texte alternatif (image), titre (vidéo) — requis pour l'accessibilité. */
  label: z.string().min(1).optional(),
});
export type MediaRef = z.infer<typeof MediaRefSchema>;

// --- Accès programmé ---------------------------------------------------------

/** Nature de la règle d'accès. */
export const UNLOCK_KINDS = ['DATE', 'COMPLETION', 'QUIZ_PASSED'] as const;
export const UnlockKindSchema = z.enum(UNLOCK_KINDS);
export type UnlockKind = z.infer<typeof UnlockKindSchema>;

/**
 * Cadence proposée à l'auteur : ouverture jour après jour, semaine après
 * semaine, mois après mois, ou selon des dates choisies.
 * C'est une **commodité de programmation** de l'auteur — pas un découpage
 * imposé du contenu.
 */
export const UNLOCK_CADENCES = ['DAY', 'WEEK', 'MONTH', 'CUSTOM'] as const;
export const UnlockCadenceSchema = z.enum(UNLOCK_CADENCES);
export type UnlockCadence = z.infer<typeof UnlockCadenceSchema>;

/**
 * Règle d'accès à une formation, un chapitre ou une leçon.
 * S'applique indifféremment aux trois niveaux (`unlockRuleId` sur chacun).
 */
export const UnlockRuleSchema = z.object({
  id: z.string().min(1).optional(),
  kind: UnlockKindSchema,
  cadence: UnlockCadenceSchema.optional(),
  /** Date de mise à disposition (badge « 5 août » dans l'interface). */
  releaseAt: z.coerce.date().optional(),
  /** Échéance de fin de période — déclenche les rappels (phase 15). */
  dueAt: z.coerce.date().optional(),
  /** Chapitre préalable requis (pour `COMPLETION`). */
  dependsOnChapterId: z.string().min(1).optional(),
  /** Score minimal en pourcentage (pour `QUIZ_PASSED`). */
  minScore: z.number().min(0).max(100).optional(),
});
export type UnlockRule = z.infer<typeof UnlockRuleSchema>;

// --- Quiz --------------------------------------------------------------------

export const AnswerSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean().optional(),
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  answers: z.array(AnswerSchema).min(2),
  isMultipleChoice: z.boolean().optional(),
});

export const QuizSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
  /** Seuil de réussite, en pourcentage. Défaut REWORK : 80. */
  passingScore: z.number().min(0).max(100).default(80),
  feedbackTiming: z.enum(['immediate', 'end']).optional(),
});
export type Quiz = z.infer<typeof QuizSchema>;

// --- Leçon, chapitre, regroupement, formation --------------------------------

export const LessonSchema = z.object({
  id: z.string().min(1),
  /** Identifiant d'origine, conservé pour la traçabilité de la reprise de données. */
  sourceId: z.string().min(1).optional(),
  /** Intitulé libre : le formateur y écrit ce qu'il veut (y compris « S1.J2 »). */
  title: z.string().min(1),
  objective: z.string().min(1),
  content: z.string(),
  type: LessonTypeSchema,
  /**
   * Durée indicative. Une leçon peut couvrir **plusieurs jours** : il n'existe
   * aucune correspondance fixe entre une leçon et un jour.
   */
  durationMinutes: z.number().int().positive().optional(),
  points: z.number().int().min(0).default(0),
  mediaRef: MediaRefSchema.optional(),
  /** Nom d'un composant du catalogue, de nature `interactive`. */
  interactiveComponentName: z.string().min(1).optional(),
  /** Nom d'un composant du catalogue, de nature `visual`. */
  visualComponentName: z.string().min(1).optional(),
  unlockRuleId: z.string().min(1).optional(),
  position: z.number().int().min(0),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const ChapterSchema = z.object({
  id: z.string().min(1),
  /** Regroupement facultatif (ex. « Semaine 1 ») ; absent si non regroupé. */
  weekId: z.string().min(1).optional(),
  title: z.string().min(1),
  position: z.number().int().min(0),
  unlockRuleId: z.string().min(1).optional(),
  lessons: z.array(LessonSchema),
  quiz: QuizSchema.optional(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

/** Regroupement visuel facultatif. L'intitulé est libre et décidé par le formateur. */
export const WeekSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  position: z.number().int().min(1),
});
export type Week = z.infer<typeof WeekSchema>;

export const CourseStatusSchema = z.enum(['Brouillon', 'Plan', 'Publié']);

export const CourseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  status: CourseStatusSchema,
  unlockRuleId: z.string().min(1).optional(),
  /** Regroupements facultatifs. */
  weeks: z.array(WeekSchema),
  /** Tous les chapitres ; `weekId` indique le regroupement éventuel. */
  chapters: z.array(ChapterSchema),
});
export type CourseContent = z.infer<typeof CourseSchema>;

// --- Conformité du contenu ---------------------------------------------------

export interface ContentComplianceReport {
  totalLessons: number;
  interactiveLessons: number;
  visualLessons: number;
  quizzes: number;
  /** Leçons sans aucun composant interactif — cible : 0 (REQ-CNT-02). */
  lessonsWithoutInteractive: string[];
  compliant: boolean;
}

/**
 * Évalue la conformité d'une formation au modèle de référence :
 * **100 % des leçons dotées d'un composant interactif** (REQ-CNT-02).
 */
export function auditCourseContent(course: CourseContent): ContentComplianceReport {
  const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const quizzes = course.chapters.filter((chapter) => chapter.quiz !== undefined).length;

  const lessonsWithoutInteractive = lessons
    .filter((lesson) => !lesson.interactiveComponentName)
    .map((lesson) => lesson.title);

  const interactiveLessons = lessons.filter((lesson) => lesson.interactiveComponentName).length;
  const visualLessons = lessons.filter((lesson) => lesson.visualComponentName).length;

  return {
    totalLessons: lessons.length,
    interactiveLessons,
    visualLessons,
    quizzes,
    lessonsWithoutInteractive,
    compliant: lessons.length > 0 && lessonsWithoutInteractive.length === 0,
  };
}

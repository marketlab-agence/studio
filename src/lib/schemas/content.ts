import { z } from 'zod';

/**
 * Modèle de contenu de Katalyst — **source unique des contrats**.
 *
 * Hiérarchie : Formation → Semaine → Chapitre → Leçon (+ Quiz).
 * Numérotation : `S.n` pour une semaine, `S.n.J.m` pour un chapitre
 * (S = semaine de formation, J = jour de la semaine, du lundi au vendredi).
 *
 * ⚠️ Ce module ne doit PAS importer le registre de composants (qui embarque des
 * composants React) : un schéma partagé est susceptible d'être importé côté
 * client, et tirerait les 46 composants dans le bundle. La validation des noms
 * de composants se fait séparément, à la création (voir `assertKnownComponent`).
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

// --- Numérotation Semaine / Jour ---------------------------------------------

/** Code d'une semaine : `S1`, `S2`… */
export const WEEK_CODE_REGEX = /^S\d+$/;

/** Code d'un chapitre : `S.1.J.2`, `S.1.J.3.1`… */
export const CHAPTER_CODE_REGEX = /^S\.\d+\.J\.\d+(\.\d+)*$/;

export const WeekCodeSchema = z.string().regex(WEEK_CODE_REGEX, {
  message: 'Code de semaine attendu : « S1 », « S2 »…',
});

export const ChapterCodeSchema = z.string().regex(CHAPTER_CODE_REGEX, {
  message: 'Code de chapitre attendu : « S.1.J.2 » (Semaine 1, Jour 2).',
});

/** Jours de formation d'une semaine : lundi (1) → vendredi (5). */
export const DAYS_PER_WEEK = 5;

export function formatWeekCode(weekNumber: number): string {
  return `S${weekNumber}`;
}

/**
 * Construit le code d'un chapitre.
 * @param weekNumber Numéro de semaine (1-based)
 * @param dayNumber  Jour dans la semaine (1 = lundi … 5 = vendredi)
 * @param position   Position optionnelle dans la journée (sous-chapitre)
 */
export function formatChapterCode(weekNumber: number, dayNumber: number, position?: number): string {
  if (!Number.isInteger(weekNumber) || weekNumber < 1) {
    throw new Error(`Numéro de semaine invalide : ${weekNumber} (entier ≥ 1 attendu).`);
  }
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > DAYS_PER_WEEK) {
    throw new Error(
      `Numéro de jour invalide : ${dayNumber} (entier entre 1 et ${DAYS_PER_WEEK} attendu — lundi à vendredi).`,
    );
  }

  const base = `S.${weekNumber}.J.${dayNumber}`;
  return position === undefined ? base : `${base}.${position}`;
}

export interface ParsedChapterCode {
  weekNumber: number;
  dayNumber: number;
  /** Sous-parties après le jour (ex. `S.1.J.3.1` → [1]). */
  parts: number[];
}

/** Analyse un code de chapitre. Retourne `null` si le format est invalide. */
export function parseChapterCode(code: string): ParsedChapterCode | null {
  if (!CHAPTER_CODE_REGEX.test(code)) return null;

  // Forme attendue : S . <semaine> . J . <jour> [ . <partie>… ]
  // Le motif est vérifié ci-dessus, les segments sont donc sûrs à indexer.
  const [, week, , day, ...rest] = code.split('.');
  return {
    weekNumber: Number(week),
    dayNumber: Number(day),
    parts: rest.map(Number),
  };
}

// --- Chapitre, Semaine, Formation -------------------------------------------

export const LessonSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1).optional(),
  title: z.string().min(1),
  objective: z.string().min(1),
  content: z.string(),
  type: LessonTypeSchema,
  durationMinutes: z.number().int().positive().optional(),
  points: z.number().int().min(0).default(0),
  mediaRef: MediaRefSchema.optional(),
  /** Nom d'un composant du registre, de nature `interactive`. */
  interactiveComponentName: z.string().min(1).optional(),
  /** Nom d'un composant du registre, de nature `visual`. */
  visualComponentName: z.string().min(1).optional(),
  position: z.number().int().min(0),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const ChapterSchema = z.object({
  id: z.string().min(1),
  code: ChapterCodeSchema,
  title: z.string().min(1),
  position: z.number().int().min(0),
  lessons: z.array(LessonSchema),
  quiz: QuizSchema.optional(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const WeekSchema = z.object({
  id: z.string().min(1),
  code: WeekCodeSchema,
  title: z.string().min(1).optional(),
  position: z.number().int().min(1),
  chapters: z.array(ChapterSchema),
});
export type Week = z.infer<typeof WeekSchema>;

export const CourseStatusSchema = z.enum(['Brouillon', 'Plan', 'Publié']);

export const CourseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  status: CourseStatusSchema,
  weeks: z.array(WeekSchema),
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
  const lessons = course.weeks.flatMap((week) => week.chapters.flatMap((chapter) => chapter.lessons));
  const quizzes = course.weeks.flatMap((week) =>
    week.chapters.filter((chapter) => chapter.quiz !== undefined),
  ).length;

  const lessonsWithoutInteractive = lessons
    .filter((lesson) => !lesson.interactiveComponentName)
    .map((lesson) => lesson.code ?? lesson.id);

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

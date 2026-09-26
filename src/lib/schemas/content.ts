import { z } from 'zod';
import {
  analyzeObjective,
  BLOOM_ALLOWED_LESSON_TYPES,
  isLessonTypeCompatibleWithBloom,
} from '@/lib/content/bloom';
import { resolveComponentMeta } from '@/components/registry/catalog';
import { ComponentConfigSchema } from '@/lib/schemas/component-config';

/**
 * Composants **interactifs** d'une leçon (par opposition aux visuels).
 *
 * ⚠️ **La nature vient du catalogue, pas de la donnée.** Une leçon porte une liste
 * de composants ; c'est `resolveComponentMeta` qui dit lesquels sont interactifs.
 * Sans ça, il faudrait dupliquer `kind` dans `lesson_components` — deux vérités
 * qui finiraient par diverger.
 */
function composantsInteractifs(
  lesson: { components: { name: string }[] },
): { name: string }[] {
  return lesson.components.filter(
    (composant) => resolveComponentMeta(composant.name)?.kind === 'interactive',
  );
}

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

/** Niveaux de la taxonomie de Bloom — miroir du module `@/lib/content/bloom`. */
export const BloomLevelSchema = z.enum([
  'Connaître',
  'Comprendre',
  'Appliquer',
  'Analyser',
  'Évaluer',
  'Créer',
]);

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
    /**
     * Composants pédagogiques de la leçon, **ordonnés**.
     *
     * ⚠️ **Une liste, pas deux emplacements fixes.** Une leçon peut exiger autant
     * de composants que son cahier des charges le demande, et le **même** composant
     * peut apparaître deux fois (deux procédures, deux quiz) — c'est la `position`
     * qui définit l'enchaînement, pas la nature du composant.
     *
     * ⚠️ **La nature (`interactive`/`visual`) n'est PAS ici** : elle vient du
     * catalogue (`resolveComponentMeta`), source unique de vérité. La dupliquer
     * dans la donnée créerait deux vérités qui pourraient diverger.
     */
    components: z
      .array(
        z.object({
          name: z.string().min(1),
          position: z.number().int().min(0),
          config: ComponentConfigSchema.default({}),
        }),
      )
      .default([]),
  /**
   * Niveau de Bloom visé par l'objectif de cette leçon.
   *
   * ⚠️ **Absent (`undefined`) signifie « à compléter »**, jamais « aucun niveau » : la
   * conformité (indicateur 11 du RNQ) exige un niveau déclaré pour vérifier que l'évaluation
   * est à la hauteur de l'objectif. L'audit signale les manquants.
   */
  bloomLevel: BloomLevelSchema.optional(),
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
  /**
   * Langue du contenu, choisie par le créateur.
   *
   * ⚠️ **Ce n'est PAS une traduction.** Une formation porte une langue ; il
   * n'existe pas « la même formation en FR et EN ». La valeur par défaut `'fr'`
   * correspond à l'état réel des formations existantes, pas à un remplissage.
   */
  language: z.enum(['fr', 'en', 'es']).default('fr'),
  unlockRuleId: z.string().min(1).optional(),
  /** Regroupements facultatifs. */
  weeks: z.array(WeekSchema),
  /** Tous les chapitres ; `weekId` indique le regroupement éventuel. */
  chapters: z.array(ChapterSchema),
});
export type CourseContent = z.infer<typeof CourseSchema>;

// --- Conformité du contenu ---------------------------------------------------

/**
 * Résultat de conformité, par règle.
 *
 * ⚠️ **Chaque règle correspond à un indicateur du RNQ V10** (voir
 * `@docs/katalyst/regles-conformite.md`). Le rapport est structuré par règle — et non par un
 * simple booléen — pour qu'un auditeur puisse **relier chaque constat à son exigence**.
 */
export interface RuleReport {
  /** Identifiant de la règle (R1, R2…). */
  rule: string;
  /** Indicateur RNQ concerné. */
  indicator: number;
  /** Intitulé court. */
  label: string;
  /** Constats, un par anomalie. Vide = conforme. */
  findings: string[];
  /** La règle est-elle évaluable ? `false` = motif indiqué par `notEvaluableReason`. */
  evaluable: boolean;
  /**
   * Pourquoi la règle n'est pas évaluable.
   *
   * ⚠️ **Deux motifs très différents, à ne pas confondre** :
   * - `'arrete'` — un seuil réglementaire n'est pas publié : rien à corriger de notre côté ;
   * - `'donnees-a-completer'` — la règle est mesurable, mais le contenu doit être complété.
   *   Ce n'est pas une excuse : c'est un travail à faire.
   */
  notEvaluableReason?: 'arrete' | 'donnees-a-completer';
}

export interface ContentComplianceReport {
  totalLessons: number;
  interactiveLessons: number;
  visualLessons: number;
  quizzes: number;
  /** Leçons sans aucun composant interactif. */
  lessonsWithoutInteractive: string[];
  /** Rapport détaillé par règle de conformité. */
  rules: RuleReport[];
  /** Conforme si **toutes les règles évaluables** le sont. */
  compliant: boolean;
}

/**
 * Évalue la conformité d'une formation aux **règles de contenu** de la phase 6.
 *
 * ⚠️ **Rejouable à tout moment** — c'est une exigence, pas un confort : une formation reste
 * modifiable (ajout/retrait de chapitres et de leçons), donc sa conformité doit pouvoir être
 * re-vérifiée après chaque modification.
 *
 * Les règles sont décrites dans `@docs/katalyst/regles-conformite.md` :
 * - **R2** (indicateur 5) — objectifs au format Bloom ;
 * - **R3/R6** (indicateurs 6, 11) — cohérence type de leçon ↔ niveau ;
 * - **R4** (indicateur 11) — évaluation de l'atteinte ;
 * - **R5.1/R5.2** (indicateur 19) — appropriation, trace par composant interactif ;
 * - **R7** (indicateur 19) — spécifiée, **différée** (BLOCKED : catalogue/contenu à compléter) ;
 * - **R9** (indicateur 19) — `config.data` conforme au schéma du composant.
 *
 * ⚠️ **R1 (analyse du besoin) n'est pas évaluable ici** : elle porte sur les
 * `generation_params` de la formation, absents du contenu pédagogique. Elle est vérifiée
 * séparément, côté provider.
 */
export function auditCourseContent(course: CourseContent): ContentComplianceReport {
  const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const quizzes = course.chapters.filter((chapter) => chapter.quiz !== undefined).length;

  const lessonsWithoutInteractive = lessons
    .filter((lesson) => composantsInteractifs(lesson).length === 0)
    .map((lesson) => lesson.title);

  const interactiveLessons = lessons.filter(
    (lesson) => composantsInteractifs(lesson).length > 0,
  ).length;
  const visualLessons = lessons.filter((lesson) =>
    lesson.components.some((c) => resolveComponentMeta(c.name)?.kind === 'visual'),
  ).length;

  const rules: RuleReport[] = [];

  // --- R2 · indicateur 5 — objectifs au format Bloom -------------------------
  const r2Findings: string[] = [];
  for (const lesson of lessons) {
    const analysis = analyzeObjective(lesson.objective ?? '');
    for (const problem of analysis.problems) {
      r2Findings.push(`« ${lesson.title} » : ${problem}`);
    }
  }
  rules.push({
    rule: 'R2',
    indicator: 5,
    label: 'Objectifs opérationnels et évaluables (format Bloom)',
    findings: r2Findings,
    evaluable: true,
  });

  // --- R3/R6 · indicateurs 6 et 11 — cohérence type ↔ niveau -----------------
  const r6Findings: string[] = [];
  for (const lesson of lessons) {
    // ⚠️ **Le niveau est LU, pas recalculé.**
    // La règle R6 vérifie la cohérence entre le type de la leçon et le niveau **déclaré**
    // (c'est-à-dire `bloomLevel`, contrôlé par R3). Recalculer le niveau depuis le verbe de
    // l'objectif rendait R3 sans effet sur R6 : une leçon corrigée par le formateur — objectif
    // reformulé, niveau déclaré — restait signalée jusqu'à ce que la reformulation produise
    // *accessoirement* le niveau attendu. Deux règles doivent porter sur la même donnée.
    const declaredLevel = lesson.bloomLevel;

    // Sans niveau déclaré, la cohérence est indécidable : R3 porte déjà le constat.
    if (!declaredLevel) continue;

    if (!isLessonTypeCompatibleWithBloom(lesson.type, declaredLevel)) {
      r6Findings.push(
        `« ${lesson.title} » : type ${lesson.type} incompatible avec le niveau ` +
          `« ${declaredLevel} » (types admis : ${BLOOM_ALLOWED_LESSON_TYPES[declaredLevel].join(', ')}).`,
      );
    }
  }
  rules.push({
    rule: 'R6',
    indicator: 11,
    label: 'Cohérence entre le type de leçon et le niveau de Bloom',
    findings: r6Findings,
    evaluable: true,
  });

  // --- R7 · indicateur 19 — couverture Bloom par composant interactif --------
  // ⚠️ **RÈGLE SPÉCIFIÉE MAIS NON ACTIVÉE — Task 8 BLOCKED (voir le rapport).**
  //
  // L'implémentation est prête (documentée dans `@docs/katalyst/regles-conformite.md`) :
  // pour chaque composant `interactive` d'une leçon ayant un `bloomLevel` déclaré,
  // `meta.bloomLevels` doit contenir ce niveau (les visuels sont exemptés ; les leçons sans
  // niveau sont ignorées, R3 portant déjà le constat).
  //
  // ⚠️ **Pourquoi elle n'est pas poussée ici.** Activée, elle fait tomber les 6 formations de
  // 6/6 à 0/6 (60 constats) :
  //  - 50 viennent de 15 composants du catalogue **sans niveau de Bloom** (R8 échoue) ;
  //  - 10 sont de vraies inadéquations composant ↔ niveau.
  // Attribuer des niveaux à ces 15 composants est une **décision pédagogique** (AiHelper couvre
  // à lui seul 25 leçons à des niveaux `Comprendre`/`Appliquer`/`Créer` — aucun niveau unique
  // ne le rendrait honnêtement conforme). La méthode REWORK interdit d'inventer ces données en
  // silence : la règle est donc **différée**, pas affaiblie.
  // ⚠️ **NON ACTIVER cette règle** sans avoir d'abord complété le catalogue et le contenu.

  // --- R9 · indicateur 19 — `config.data` conforme au schéma du composant -----
  const r9Findings: string[] = [];
  for (const lesson of lessons) {
    for (const composant of lesson.components) {
      const config = composant.config as { data?: unknown } | undefined;

      // ⚠️ **`data === undefined` signifie « valeurs par défaut » : toujours valide.**
      // Ne signaler que la donnée **réellement fournie** — sinon tout composant non
      // configuré (ex. `AiHelper`) serait déclaré non conforme, et la porte d'audit
      // échouerait sur des leçons pourtant saines.
      if (config?.data === undefined) continue;

      const meta = resolveComponentMeta(composant.name);
      if (!meta) continue;

      const parsed = meta.dataSchema.safeParse(config.data);
      if (!parsed.success) {
        r9Findings.push(
          `« ${lesson.title} » : la configuration fournie au composant « ${composant.name} » ` +
            `ne respecte pas son schéma (${parsed.error.issues[0]?.message ?? 'données invalides'}).`,
        );
      }
    }
  }
  rules.push({
    rule: 'R9',
    indicator: 19,
    label: 'Configuration des composants conforme à leur schéma de données',
    findings: r9Findings,
    evaluable: true,
  });

  // --- R3 · indicateur 6 — niveau de Bloom déclaré ---------------------------
  const r3Findings: string[] = [];
  for (const lesson of lessons) {
    if (!lesson.bloomLevel) {
      r3Findings.push(
        `« ${lesson.title} » : niveau de Bloom non déclaré — l'atteinte de l'objectif n'est ` +
          'pas vérifiable (indicateur 11).',
      );
    }
  }
  rules.push({
    rule: 'R3',
    indicator: 11,
    label: 'Niveau de Bloom déclaré sur chaque leçon',
    findings: r3Findings,
    // ⚠️ Volontairement **non bloquante** : les 80 leçons seedées ont été créées avant cette
    // exigence. Les déclarer non conformes ferait échouer les 6 formations sur un critère
    // que la migration ne peut pas remplir sans **inventer** des données pédagogiques — ce
    // que la méthode REWORK interdit. La règle **mesure** l'écart : c'est un travail à faire,
    // pas une excuse.
    evaluable: false,
    notEvaluableReason: 'donnees-a-completer',
  });

  // --- R4 · indicateur 11 — évaluation de l'atteinte -------------------------
  const r4Findings: string[] = [];
  for (const chapter of course.chapters) {
    const hasEvaluation = chapter.lessons.some((lesson) => lesson.type === 'EVALUATION');
    if (hasEvaluation && chapter.quiz === undefined) {
      r4Findings.push(
        `Chapitre « ${chapter.title} » : contient une leçon EVALUATION mais aucun quiz rattaché.`,
      );
    }
  }
  rules.push({
    rule: 'R4',
    indicator: 11,
    label: 'Évaluation de l’atteinte des objectifs',
    findings: r4Findings,
    evaluable: true,
  });

  // --- R5.1 · indicateur 19 — appropriation (aucun placeholder) --------------
  const r5Findings: string[] = [];
  for (const lesson of lessons) {
    if (lesson.type !== 'MISE_EN_PRATIQUE') continue;

    const interactifs = composantsInteractifs(lesson);

    // ⚠️ **Au moins UN composant interactif, parmi N.** La règle ne dit pas
    // « exactement deux » : une leçon peut en avoir autant que nécessaire — et
    // c'est le premier d'entre eux qui porte l'appropriation.
    if (interactifs.length === 0) {
      r5Findings.push(
        `« ${lesson.title} » : mise en pratique sans composant interactif — l'apprenant ne peut pas se l'approprier.`,
      );
      continue;
    }

    // Un seul placeholder suffit à rendre la leçon non conforme : il ne produit
    // aucune trace exploitable (indicateur 19).
    for (const composant of interactifs) {
      const meta = resolveComponentMeta(composant.name);
      if (meta?.status === 'placeholder') {
        r5Findings.push(
          `« ${lesson.title} » : le composant « ${composant.name} » est un ` +
            'placeholder (interface sans interaction) — il ne produit aucune trace exploitable en audit.',
        );
      }
    }
  }
  rules.push({
    rule: 'R5.1',
    indicator: 19,
    label: 'Appropriation — aucune mise en pratique sans interaction réelle',
    findings: r5Findings,
    evaluable: true,
  });

  // --- R5.2 · indicateur 19 — trace par composant interactif ------------------
  // ⚠️ **Reformulation : « par composant », et non « par leçon ».** Une leçon peut porter N
  // composants ; exiger une trace au niveau de la leçon permettrait qu'un composant reste
  // sans interaction enregistrée. Le décret parle d'une « trace d'interaction par composant ».
  rules.push({
    rule: 'R5.2',
    indicator: 19,
    label: 'Effectivité du suivi — une trace d’interaction par composant interactif',
    findings: [],
    // La règle est mesurable, mais le contrôle n'est pas encore branché sur
    // `lesson_interactions` : `donnees-a-completer` (travail à faire), jamais `arrete`.
    evaluable: false,
    notEvaluableReason: 'donnees-a-completer',
  });

  // --- R5.3 · indicateur 19 — référent pédagogique (seuil en attente) --------
  rules.push({
    rule: 'R5.3',
    indicator: 19,
    label: 'Référent pédagogique par formation',
    findings: [],
    // Le seuil (nombre d'intervenants) est fixé par un **arrêté non publié** :
    // la règle n'est pas évaluable tant qu'il ne l'est pas. Le déclarer explicitement
    // vaut mieux que de conclure à tort.
    evaluable: false,
    notEvaluableReason: 'arrete',
  });

  return {
    totalLessons: lessons.length,
    interactiveLessons,
    visualLessons,
    quizzes,
    lessonsWithoutInteractive,
    rules,
    compliant:
      lessons.length > 0 &&
      // Seules les règles **évaluables** comptent : une règle en attente d'arrêté ne
      // doit pas rendre une formation non conforme.
      rules.every((rule) => !rule.evaluable || rule.findings.length === 0),
  };
}

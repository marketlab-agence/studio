import {
  LessonSchema,
  ChapterSchema,
  UnlockRuleSchema,
  CourseSchema,
  auditCourseContent,
  type CourseContent,
} from '@/lib/schemas/content';

describe('Schémas de contenu', () => {
  it('refuse une leçon sans objectif', () => {
    const result = LessonSchema.safeParse({
      id: 'l1',
      title: 'Titre',
      objective: '',
      content: 'x',
      type: 'TEXTE',
      position: 0,
    });
    expect(result.success).toBe(false);
  });

  it('applique les valeurs par défaut (points)', () => {
    const result = LessonSchema.safeParse({
      id: 'l1',
      title: 'Titre',
      objective: 'Objectif',
      content: 'x',
      type: 'VIDEO',
      position: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.points).toBe(0);
  });

  it("accepte une durée libre — une leçon peut couvrir plusieurs jours", () => {
    const result = LessonSchema.safeParse({
      id: 'l1',
      title: 'Leçon longue',
      objective: 'Objectif',
      content: 'x',
      type: 'MISE_EN_PRATIQUE',
      durationMinutes: 240,
      position: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepte un chapitre sans regroupement (weekId absent)', () => {
    const result = ChapterSchema.safeParse({
      id: 'c1',
      title: 'Chapitre libre',
      position: 0,
      lessons: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepte un intitulé libre contenant « S1.J2 » (libellé, pas donnée)", () => {
    const result = ChapterSchema.safeParse({
      id: 'c1',
      title: 'S.1.J.2 — Démystifions la boîte noire',
      position: 0,
      lessons: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("Accès programmé (accès par période, comme REWORK)", () => {
  it('accepte une ouverture à une date avec cadence hebdomadaire', () => {
    const result = UnlockRuleSchema.safeParse({
      kind: 'DATE',
      cadence: 'WEEK',
      releaseAt: '2026-08-05',
      dueAt: '2026-08-12',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.releaseAt).toBeInstanceOf(Date);
      expect(result.data.cadence).toBe('WEEK');
    }
  });

  it('accepte un déblocage conditionnel avec score minimal', () => {
    const result = UnlockRuleSchema.safeParse({
      kind: 'QUIZ_PASSED',
      dependsOnChapterId: 'intro-to-git',
      minScore: 80,
    });
    expect(result.success).toBe(true);
  });

  it('refuse une cadence inconnue', () => {
    const result = UnlockRuleSchema.safeParse({ kind: 'DATE', cadence: 'TRIMESTRE' });
    expect(result.success).toBe(false);
  });

  it('refuse un score hors bornes', () => {
    expect(UnlockRuleSchema.safeParse({ kind: 'QUIZ_PASSED', minScore: 120 }).success).toBe(false);
  });
});

describe('Formation', () => {
  it('accepte une formation sans aucun regroupement', () => {
    const result = CourseSchema.safeParse({
      id: 'c',
      title: 'Formation',
      description: '',
      status: 'Publié',
      weeks: [],
      chapters: [
        { id: 'ch1', title: 'Chapitre 1', position: 0, lessons: [] },
        { id: 'ch2', title: 'Chapitre 2', position: 1, lessons: [] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepte une formation avec regroupements libres', () => {
    const result = CourseSchema.safeParse({
      id: 'c',
      title: 'Formation',
      description: '',
      status: 'Publié',
      weeks: [{ id: 'w1', title: 'Semaine 1', position: 1 }],
      chapters: [{ id: 'ch1', weekId: 'w1', title: 'Chapitre 1', position: 0, lessons: [] }],
    });
    expect(result.success).toBe(true);
  });
});

describe('Audit de conformité du contenu', () => {
  /**
   * ⚠️ Depuis la phase 6, « conforme » ne signifie plus seulement « dotée d'un composant
   * interactif » : l'audit évalue les **règles R2, R4, R5.1, R6** adossées au RNQ V10
   * (`@docs/katalyst/regles-conformite.md`).
   *
   * L'objectif doit donc respecter la **formule Bloom** (verbe d'action + critères entre
   * parenthèses), et le composant ne doit pas être un placeholder.
   */
  const course = (
    withInteractive: boolean,
    objective = "L'apprenant sera capable de fusionner deux branches (sans conflit résiduel)",
  ): CourseContent => ({
    id: 'c',
    title: 'Formation',
    description: '',
    status: 'Publié',
    language: 'fr',
    weeks: [],
    chapters: [
      {
        id: 'c1',
        title: 'Chapitre',
        position: 0,
        lessons: [
          {
            id: 'l1',
            title: 'Leçon',
            objective,
            content: '',
            type: 'MISE_EN_PRATIQUE',
            points: 0,
            position: 0,
            components: withInteractive ? [{ name: 'MergeSimulator', position: 0, config: {} }] : [],
          },
        ],
      },
    ],
  });

  it('déclare conforme une formation interactive ET aux objectifs Bloom valides', () => {
    const report = auditCourseContent(course(true));

    expect(report.totalLessons).toBe(1);
    expect(report.lessonsWithoutInteractive).toHaveLength(0);
    // Aucune règle évaluable ne doit signaler de constat.
    const evaluables = report.rules.filter((rule) => rule.evaluable);
    expect(evaluables.flatMap((rule) => rule.findings)).toEqual([]);
    expect(report.compliant).toBe(true);
  });

  it('signale les leçons sans composant interactif', () => {
    const report = auditCourseContent(course(false));

    expect(report.compliant).toBe(false);
    expect(report.lessonsWithoutInteractive).toEqual(['Leçon']);
  });

  it('signale un objectif qui ne respecte pas la formule Bloom (règle R2)', () => {
    // « Objectif » est exactement le genre de libellé que l'indicateur 5 interdit :
    // sans verbe d'action identifiable, il n'est pas évaluable.
    const report = auditCourseContent(course(true, 'Objectif'));

    const r2 = report.rules.find((rule) => rule.rule === 'R2');
    expect(r2?.findings.length).toBeGreaterThan(0);
    expect(report.compliant).toBe(false);
  });

  it('déclare non évaluable la règle du référent pédagogique (seuil en attente d’arrêté)', () => {
    const report = auditCourseContent(course(true));

    const r53 = report.rules.find((rule) => rule.rule === 'R5.3');
    // Un seuil fixé par un arrêté non publié ne doit pas rendre une formation non conforme :
    // la règle est déclarée non évaluable plutôt que de conclure à tort.
    expect(r53?.evaluable).toBe(false);
  });

  it('expose chaque règle avec son indicateur RNQ', () => {
    const report = auditCourseContent(course(true));

    const parIndicateur = report.rules.map((rule) => rule.indicator);
    // Les règles de la phase 6 portent sur les indicateurs 5, 11 et 19.
    expect(parIndicateur).toEqual(expect.arrayContaining([5, 11, 19]));
  });
});

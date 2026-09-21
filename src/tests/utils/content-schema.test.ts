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
  const course = (withInteractive: boolean): CourseContent => ({
    id: 'c',
    title: 'Formation',
    description: '',
    status: 'Publié',
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
            objective: 'Objectif',
            content: '',
            type: 'MISE_EN_PRATIQUE',
            points: 0,
            position: 0,
            ...(withInteractive ? { interactiveComponentName: 'MergeSimulator' } : {}),
          },
        ],
      },
    ],
  });

  it('déclare conforme une formation dont toutes les leçons sont interactives', () => {
    const report = auditCourseContent(course(true));
    expect(report.totalLessons).toBe(1);
    expect(report.compliant).toBe(true);
    expect(report.lessonsWithoutInteractive).toHaveLength(0);
  });

  it('signale les leçons sans composant interactif', () => {
    const report = auditCourseContent(course(false));
    expect(report.compliant).toBe(false);
    expect(report.lessonsWithoutInteractive).toEqual(['Leçon']);
  });
});

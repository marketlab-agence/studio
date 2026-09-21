import {
  formatWeekCode,
  formatChapterCode,
  parseChapterCode,
  WEEK_CODE_REGEX,
  CHAPTER_CODE_REGEX,
  LessonSchema,
  ChapterSchema,
  DAYS_PER_WEEK,
  auditCourseContent,
  type CourseContent,
} from '@/lib/schemas/content';

describe('Numérotation Semaine / Jour', () => {
  it('formate un code de semaine', () => {
    expect(formatWeekCode(1)).toBe('S1');
    expect(formatWeekCode(12)).toBe('S12');
    expect(WEEK_CODE_REGEX.test('S1')).toBe(true);
    expect(WEEK_CODE_REGEX.test('Semaine 1')).toBe(false);
  });

  it('formate un code de chapitre S.n.J.m', () => {
    expect(formatChapterCode(1, 2)).toBe('S.1.J.2');
    expect(formatChapterCode(1, 3, 1)).toBe('S.1.J.3.1');
    expect(CHAPTER_CODE_REGEX.test('S.1.J.2')).toBe(true);
    expect(CHAPTER_CODE_REGEX.test('1.2')).toBe(false);
  });

  it('refuse un jour hors lundi-vendredi', () => {
    expect(() => formatChapterCode(1, 0)).toThrow(/jour invalide/);
    expect(() => formatChapterCode(1, DAYS_PER_WEEK + 1)).toThrow(/jour invalide/);
    expect(() => formatChapterCode(1, 5)).not.toThrow();
  });

  it('refuse une semaine invalide', () => {
    expect(() => formatChapterCode(0, 1)).toThrow(/semaine invalide/);
  });

  it('analyse un code de chapitre', () => {
    expect(parseChapterCode('S.1.J.2')).toEqual({ weekNumber: 1, dayNumber: 2, parts: [] });
    expect(parseChapterCode('S.1.J.3.1')).toEqual({ weekNumber: 1, dayNumber: 3, parts: [1] });
    expect(parseChapterCode('invalide')).toBeNull();
  });
});

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

  it('refuse un code de chapitre hors format S.n.J.m', () => {
    const result = ChapterSchema.safeParse({
      id: 'c1',
      code: 'chapitre-1',
      title: 'Titre',
      position: 0,
      lessons: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('Audit de conformité du contenu', () => {
  const course = (withInteractive: boolean): CourseContent => ({
    id: 'c',
    title: 'Formation',
    description: '',
    status: 'Publié',
    weeks: [
      {
        id: 'w1',
        code: 'S1',
        position: 1,
        chapters: [
          {
            id: 'c1',
            code: 'S.1.J.1',
            title: 'Chapitre',
            position: 0,
            lessons: [
              {
                id: 'l1',
                code: 'S.1.J.1.1',
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
    expect(report.lessonsWithoutInteractive).toEqual(['S.1.J.1.1']);
  });
});

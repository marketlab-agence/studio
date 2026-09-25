import { auditCourseContent, CourseSchema, type CourseContent } from '@/lib/schemas/content';
import { listByBloomLevel, type ComponentDomain } from '@/components/registry/catalog';
import { BLOOM_LEVELS } from '@/lib/content/bloom';

/**
 * @jest-environment node
 *
 * **Contrainte de réversibilité** (étape 17) — décision utilisateur du 2026-09-23 :
 *
 * > *« Toute formation sur la plateforme doit demeurer modifiable (allongeant ou raccourcissant
 * > le nombre de chapitres et/ou le nombre de leçons par chapitre). »*
 *
 * ⚠️ **Ce test vérifie que la conformité SURVIT à une modification.** C'est une exigence
 * souvent oubliée : une formation peut être conforme à la création puis devenir non conforme
 * après un simple ajout de leçon — sans que personne ne s'en aperçoive, puisque l'audit n'est
 * pas relancé.
 *
 * Conséquence de conception déjà en place : `npm run audit:content` est **rejouable** (T6.1), et
 * `saveChapters` synchronise les leçons (ajout **et** retrait) sans effacer la progression.
 */

type LessonInput = {
  id: string;
  bloomLevel: (typeof BLOOM_LEVELS)[number];
  lessonType: CourseContent['chapters'][number]['lessons'][number]['type'];
};

function componentFor(level: (typeof BLOOM_LEVELS)[number], domain: ComponentDomain): string {
  const candidats = listByBloomLevel('interactive', level, domain);
  if (!candidats[0]) throw new Error(`Aucun composant pour ${level} dans ${domain}`);
  return candidats[0].name;
}

const VERBS: Record<(typeof BLOOM_LEVELS)[number], string> = {
  Connaître: 'lister les commandes essentielles',
  Comprendre: 'expliquer le rôle de l’index',
  Appliquer: 'appliquer la procédure',
  Analyser: 'analyser un historique complexe',
  Évaluer: 'évaluer deux stratégies',
  Créer: 'concevoir un flux de travail',
};

function makeLesson(input: LessonInput, domain: ComponentDomain) {
  return {
    id: input.id,
    title: `Leçon ${input.id}`,
    objective: `L'apprenant sera capable de ${VERBS[input.bloomLevel]} (selon les critères)`,
    content: 'Contenu.',
    type: input.lessonType,
    bloomLevel: input.bloomLevel,
    points: 0,
    position: 0,
    interactiveComponentName: componentFor(input.bloomLevel, domain),
  };
}

const TYPE_FOR = (level: (typeof BLOOM_LEVELS)[number]) =>
  level === 'Connaître' || level === 'Évaluer'
    ? ('EVALUATION' as const)
    : ('MISE_EN_PRATIQUE' as const);

/** Formation de départ : 1 chapitre, 3 leçons conformes. */
function baseCourse(): CourseContent {
  const levels = ['Comprendre', 'Appliquer', 'Analyser'] as const;

  return {
    id: 'formation-modifiable',
    title: 'Formation modifiable',
    description: '',
    status: 'Publié' as const,
    language: 'fr' as const,
    weeks: [],
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapitre 1',
        position: 0,
        lessons: levels.map((level, index) =>
          makeLesson({ id: `l-${index + 1}`, bloomLevel: level, lessonType: TYPE_FOR(level) }, 'git'),
        ),
        quiz: {
          id: 'q-1',
          title: 'Quiz',
          passingScore: 80,
          feedbackTiming: 'end' as const,
          questions: [
            {
              id: 'qq-1',
              text: 'Question ?',
              answers: [
                { id: 'a-1', text: 'Bonne', isCorrect: true },
                { id: 'a-2', text: 'Mauvaise', isCorrect: false },
              ],
            },
          ],
        },
      },
    ],
  };
}

/** Audit réduit aux règles du ressort du code (les autres dépendent du contenu rédactionnel). */
function auditRegles(course: CourseContent) {
  const parsed = CourseSchema.safeParse(course);
  if (!parsed.success) {
    throw new Error(
      `Contenu invalide : ${parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join(' | ')}`,
    );
  }

  const audit = auditCourseContent(parsed.data);
  return Object.fromEntries(audit.rules.map((rule) => [rule.rule, rule.findings]));
}

const REGLES_DE_CODE = ['R2', 'R4', 'R5.1', 'R6'] as const;

describe('conformité après modification — contrainte utilisateur', () => {
  it('la formation de départ est conforme', () => {
    const findings = auditRegles(baseCourse());

    for (const regle of REGLES_DE_CODE) {
      expect({ regle, findings: findings[regle] }).toEqual({ regle, findings: [] });
    }
  });

  it('reste conforme après AJOUT d’un chapitre', () => {
    const course = baseCourse();

    // Modification : on allonge la formation d'un chapitre complet.
    course.chapters.push({
      id: 'ch-2',
      title: 'Chapitre 2',
      position: 1,
      lessons: [
        makeLesson({ id: 'l-4', bloomLevel: 'Créer', lessonType: TYPE_FOR('Créer') }, 'git'),
      ],
      quiz: {
        id: 'q-2',
        title: 'Quiz 2',
        passingScore: 80,
        feedbackTiming: 'end' as const,
        questions: [
          {
            id: 'qq-2',
            text: 'Question ?',
            answers: [
              { id: 'a-3', text: 'Bonne', isCorrect: true },
              { id: 'a-4', text: 'Mauvaise', isCorrect: false },
            ],
          },
        ],
      },
    });

    const findings = auditRegles(course);
    for (const regle of REGLES_DE_CODE) {
      expect({ regle, findings: findings[regle] }).toEqual({ regle, findings: [] });
    }
  });

  it('reste conforme après AJOUT d’une leçon dans un chapitre existant', () => {
    const course = baseCourse();

    course.chapters[0].lessons.push(
      makeLesson({ id: 'l-4', bloomLevel: 'Évaluer', lessonType: TYPE_FOR('Évaluer') }, 'git'),
    );

    const findings = auditRegles(course);
    for (const regle of REGLES_DE_CODE) {
      expect({ regle, findings: findings[regle] }).toEqual({ regle, findings: [] });
    }
  });

  it('reste conforme après RETRAIT d’un chapitre entier', () => {
    const course = baseCourse();

    // Modification : on raccourcit — un chapitre, puis on en laisse un seul.
    course.chapters.push({
      id: 'ch-2',
      title: 'Chapitre 2',
      position: 1,
      lessons: [makeLesson({ id: 'l-4', bloomLevel: 'Créer', lessonType: TYPE_FOR('Créer') }, 'git')],
      quiz: {
        id: 'q-2',
        title: 'Quiz 2',
        passingScore: 80,
        feedbackTiming: 'end' as const,
        questions: [
          {
            id: 'qq-2',
            text: 'Q ?',
            answers: [
              { id: 'a-3', text: 'B', isCorrect: true },
              { id: 'a-4', text: 'M', isCorrect: false },
            ],
          },
        ],
      },
    });

    // Puis on le retire : la formation revient à son état de départ.
    course.chapters = course.chapters.filter((chapter) => chapter.id !== 'ch-2');

    const findings = auditRegles(course);
    for (const regle of REGLES_DE_CODE) {
      expect({ regle, findings: findings[regle] }).toEqual({ regle, findings: [] });
    }
  });

  it('reste conforme après RETRAIT d’une leçon', () => {
    const course = baseCourse();

    // Modification : on raccourcit le chapitre d'une leçon.
    course.chapters[0].lessons = course.chapters[0].lessons.filter((lesson) => lesson.id !== 'l-2');

    const findings = auditRegles(course);
    for (const regle of REGLES_DE_CODE) {
      expect({ regle, findings: findings[regle] }).toEqual({ regle, findings: [] });
    }
  });

  it('DÉTECTE une régression : une leçon ajoutée sans niveau de Bloom est signalée', () => {
    // ⚠️ Ce test est le plus important de ce fichier. Il vérifie que l'audit **détecte** une
    // modification qui casse la conformité — sinon, une formation pourrait se dégrader
    // silencieusement au fil des éditions.
    const course = baseCourse();

    course.chapters[0].lessons.push({
      id: 'l-sans-niveau',
      title: 'Leçon ajoutée à la hâte',
      objective: 'Objectif',
      content: 'Contenu.',
      type: 'MISE_EN_PRATIQUE',
      points: 0,
      position: 0,
      // Ni `bloomLevel`, ni composant : c'est exactement l'oubli à détecter.
    });

    const findings = auditRegles(course);

    // R2 : l'objectif ne respecte pas la formule Bloom.
    expect(findings.R2.length).toBeGreaterThan(0);
    // R5.1 : mise en pratique sans composant interactif.
    expect(findings['R5.1'].length).toBeGreaterThan(0);
    // R3 : le niveau de Bloom manque (règle non bloquante, mais elle doit le voir).
    expect(findings.R3.length).toBeGreaterThan(0);
  });
});

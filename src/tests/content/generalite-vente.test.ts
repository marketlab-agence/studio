import {
  auditCourseContent,
  CourseSchema,
  type CourseContent,
} from '@/lib/schemas/content';
import {
  listFunctionalInteractiveNamesForDomain,
  listByBloomLevel,
  resolveComponentMeta,
} from '@/components/registry/catalog';
import { BLOOM_LEVELS } from '@/lib/content/bloom';

/**
 * @jest-environment node
 *
 * **Preuve de généralité** (étape 17).
 *
 * ⚠️ **Ce que ce test doit démontrer, et pourquoi il est différent des autres.**
 * Les tests précédents vérifient que des composants **existent**. Celui-ci vérifie qu'une
 * formation **nouvelle**, créée dans un domaine **sans simulateur dédié**, peut être rendue
 * **conforme** — c'est-à-dire que l'IA peut réellement construire une formation conforme avec
 * le catalogue actuel.
 *
 * Sans ce test, on saurait que le catalogue est complet, mais pas qu'il **suffit**.
 *
 * Domaine choisi : **vente**. C'est le cas le plus défavorable — avant la phase 6, *aucun*
 * composant interactif ne lui était applicable.
 */

/** Fabrique une leçon conforme : objectif Bloom, type cohérent, composant fonctionnel. */
function lesson(input: {
  id: string;
  bloomLevel: (typeof BLOOM_LEVELS)[number];
  componentName: string;
  lessonType: CourseContent['chapters'][number]['lessons'][number]['type'];
}) {
  return {
    id: input.id,
    title: `Leçon ${input.id}`,
    // Objectif au format REWORK : « L'apprenant sera capable de + verbe + (critères) ».
    objective: `L'apprenant sera capable de ${verbFor(input.bloomLevel)} (selon les critères de la fiche)`,
    content: 'Contenu de la leçon.',
    type: input.lessonType,
    bloomLevel: input.bloomLevel,
    points: 0,
    position: 0,
    interactiveComponentName: input.componentName,
  };
}

/** Verbe d'action correspondant au niveau — nécessaire pour que l'objectif soit détecté. */
function verbFor(level: (typeof BLOOM_LEVELS)[number]): string {
  const verbs: Record<(typeof BLOOM_LEVELS)[number], string> = {
    Connaître: 'lister les objections courantes',
    Comprendre: 'expliquer la différence entre deux profils clients',
    Appliquer: 'appliquer la méthode de découverte',
    Analyser: 'analyser un entretien de vente',
    Évaluer: 'évaluer la qualité d’une relance',
    Créer: 'concevoir un scénario de découverte',
  };
  return verbs[level];
}

/** Type de leçon compatible avec le niveau (règle R6). */
function typeFor(level: (typeof BLOOM_LEVELS)[number]) {
  return level === 'Connaître' || level === 'Évaluer'
    ? ('EVALUATION' as const)
    : ('MISE_EN_PRATIQUE' as const);
}

describe('généralité — une formation de VENTE peut être conforme', () => {
  /**
   * Construit une formation dont chaque leçon couvre un niveau de Bloom, en piochant dans le
   * catalogue **filtré par domaine** — exactement comme le fait `generateLessonContentAction`.
   */
  function buildSalesCourse(): CourseContent {
    return {
      id: 'formation-vente-neuve',
      title: 'Prospection commerciale : de l’appel à la signature',
      description: 'Formation créée par l’IA pour un institut de formation commerciale.',
      status: 'Publié' as const,
      weeks: [],
      chapters: [
        {
          id: 'ch-1',
          title: 'Comprendre le client',
          position: 0,
          lessons: BLOOM_LEVELS.map((level, index) => {
            const candidats = listByBloomLevel('interactive', level, 'vente');
            const component = candidats[0];

            if (!component) {
              throw new Error(`Aucun composant pour le niveau ${level} dans le domaine vente.`);
            }

            return lesson({
              id: `l-${index + 1}`,
              bloomLevel: level,
              componentName: component.name,
              lessonType: typeFor(level),
            });
          }),
          quiz: {
            id: 'q-1',
            title: 'Quiz du chapitre',
            passingScore: 80,
            feedbackTiming: 'end' as const,
            questions: [
              {
                id: 'qq-1',
                text: 'Que fait-on en premier ?',
                answers: [
                  { id: 'a-1', text: 'La découverte du besoin', isCorrect: true },
                  { id: 'a-2', text: 'La présentation du prix', isCorrect: false },
                ],
              },
            ],
          },
        },
      ],
    };
  }

  it('dispose d’un composant interactif pour CHAQUE niveau de Bloom', () => {
    // ⚠️ C'est le cœur de l'apport de la phase 6 : avant, le domaine vente n'avait **aucun**
    // composant interactif. Une formation commerciale ne pouvait pas être conforme.
    const manquants = BLOOM_LEVELS.filter(
      (level) => listByBloomLevel('interactive', level, 'vente').length === 0,
    );

    expect(manquants).toEqual([]);
  });

  it('passe l’audit de conformité sur les règles liées au catalogue', () => {
    const course = buildSalesCourse();
    const parsed = CourseSchema.safeParse(course);

    // Le contenu doit d'abord être valide au regard de son propre schéma.
    if (!parsed.success) {
      throw new Error(
        `Contenu invalide : ${parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join(' | ')}`,
      );
    }

    const audit = auditCourseContent(parsed.data);

    // ⚠️ On vérifie les règles **du ressort du code** : R4 (évaluation), R5.1 (appropriation),
    // R6 (cohérence type ↔ niveau) et R2 (format des objectifs).
    const parRegle = Object.fromEntries(audit.rules.map((rule) => [rule.rule, rule]));

    expect(parRegle.R4.findings).toEqual([]);
    expect(parRegle['R5.1'].findings).toEqual([]);
    expect(parRegle.R6.findings).toEqual([]);
    expect(parRegle.R2.findings).toEqual([]);
  });

  it('utilise EXCLUSIVEMENT des composants fonctionnels (aucun placeholder)', () => {
    const course = buildSalesCourse();
    const noms = course.chapters
      .flatMap((chapter) => chapter.lessons)
      .map((lesson) => lesson.interactiveComponentName)
      .filter((name): name is string => Boolean(name));

    const inertes = noms.filter((name) => resolveComponentMeta(name)?.status !== 'functional');

    expect(inertes).toEqual([]);
  });

  it('n’emploie que des composants proposés pour son domaine', () => {
    // L'IA ne peut choisir que dans la liste filtrée : on vérifie qu'elle suffit.
    const pourVente = new Set(listFunctionalInteractiveNamesForDomain('vente'));
    const course = buildSalesCourse();

    const horsDomaine = course.chapters
      .flatMap((chapter) => chapter.lessons)
      .map((lesson) => lesson.interactiveComponentName)
      .filter((name): name is string => Boolean(name))
      .filter((name) => !pourVente.has(name));

    expect(horsDomaine).toEqual([]);
  });
});

/**
 * Taxonomie de Bloom — fondement des règles R2, R3 et R6.
 *
 * ⚠️ **Source normative** : `@docs/rework/methodes.md` §5 et `@docs/rework/formats.md` §5.
 * La formation REWORK impose la formule :
 *   « L'apprenant sera capable de + VERBE D'ACTION + objet (CONDITIONS ; CRITÈRES) »
 * et **interdit** les verbes « comprendre » et « savoir ».
 *
 * Ce module **ne contient aucun import React** : il est utilisé par l'audit (script serveur),
 * par les schémas Zod et par l'IA. Le placer ici évite de tirer les composants.
 *
 * Fondement réglementaire : `@docs/katalyst/regles-conformite.md` — règles R2 (indicateur 5)
 * et R6 (cohérence type ↔ niveau).
 */

/** Les 6 niveaux, dans l'ordre officiel REWORK (du plus simple au plus complexe). */
export const BLOOM_LEVELS = [
  'Connaître',
  'Comprendre',
  'Appliquer',
  'Analyser',
  'Évaluer',
  'Créer',
] as const;

export type BloomLevel = (typeof BLOOM_LEVELS)[number];

/**
 * Verbes d'action par niveau.
 *
 * ⚠️ Cette liste est **extensible mais jamais réductible** : un verbe absent fait échouer la
 * détection automatique du niveau (règle R2, contrôle 4). Mieux vaut l'enrichir que de
 * tolérer une détection approximative.
 */
export const BLOOM_VERBS: Record<BloomLevel, readonly string[]> = {
  Connaître: [
    'énumérer', 'lister', 'nommer', 'identifier', 'reconnaître', 'citer', 'définir',
    'mémoriser', 'restituer', 'associer',
  ],
  Comprendre: [
    'expliquer', 'décrire', 'résumer', 'classer', 'interpréter', 'traduire', 'reformuler',
    'distinguer', 'illustrer', 'comparer',
  ],
  Appliquer: [
    'appliquer', 'utiliser', 'exécuter', 'mettre en œuvre', 'réaliser', 'employer',
    'manipuler', 'installer', 'configurer', 'calculer', 'fusionner',
    'commiter', 'cloner', 'déployer', 'paramétrer', 'implémenter',
  ],
  Analyser: [
    'analyser', 'diagnostiquer', 'décomposer', 'différencier', 'examiner', 'investiguer',
    'corréler', 'structurer', 'organiser', 'auditer',
  ],
  Évaluer: [
    'évaluer', 'juger', 'critiquer', 'justifier', 'arbitrer', 'valider', 'prioriser',
    'recommander', 'trancher', 'argumenter',
  ],
  Créer: [
    'créer', 'concevoir', 'construire', 'rédiger', 'élaborer', 'développer', 'produire',
    'composer', 'formuler', 'générer', 'planifier', 'imaginer',
  ],
};

/**
 * Verbes **interdits** par la méthode REWORK.
 * Source : `@docs/rework/methodes.md` §5 — « Verbes interdits : comprendre, savoir ».
 *
 * Ils sont refusés car **non observables** : on ne peut pas constater qu'un apprenant
 * « comprend ». C'est précisément ce que l'indicateur 5 exige d'éviter — un objectif
 * **évaluable**.
 */
export const FORBIDDEN_VERBS = ['comprendre', 'savoir', 'connaître', 'être sensibilisé'] as const;

/**
 * Normalise un texte pour la recherche de verbe.
 *
 * ⚠️ **Deux pièges réels**, découverts en écrivant les tests :
 *
 * 1. **Les apostrophes.** « d'énumérer » : la limite de mot (`\b`) échoue après l'apostrophe,
 *    donc le verbe passait inaperçu. Or la formule REWORK impose « sera capable **d'** » devant
 *    une voyelle — c'est le cas le plus fréquent.
 * 2. **Les accents.** `\b` se comporte mal avec les lettres accentuées selon le moteur.
 *
 * On normalise donc avant de chercher : apostrophes typographiques ramenées à `'`, et
 * accents retirés (les verbes sont stockés sans accent : *enumérer* → *enumérer*).
 */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    // Décomposition puis suppression des diacritiques : « é » → « e ».
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Même normalisation, appliquée aux verbes de référence. */
const NORMALIZED_VERBS = new Map<BloomLevel, string[]>(
  BLOOM_LEVELS.map((level) => [level, BLOOM_VERBS[level].map((verb) => normalizeForSearch(verb))]),
);

const NORMALIZED_FORBIDDEN = FORBIDDEN_VERBS.map((verb) => normalizeForSearch(verb));

/** Formule acceptée pour le début d'un objectif. */
export const OBJECTIVE_PREFIXES = [
  "l'apprenant sera capable de",
  "l'apprenant sera capable d'",
  'être capable de',
  'être capable d’',
  'à la fin de',
] as const;

export interface ObjectiveAnalysis {
  /** L'objectif respecte-t-il la formule REWORK complète ? */
  wellFormed: boolean;
  /** Verbe d'action détecté, s'il y en a un. */
  verb: string | null;
  /** Niveau de Bloom déduit du verbe, ou `null` si indéterminable. */
  level: BloomLevel | null;
  /** Verbe interdit détecté (rend l'objectif non conforme). */
  forbiddenVerb: string | null;
  /** Conditions et critères sont-ils présents (entre parenthèses) ? */
  hasCriteria: boolean;
  /** Motifs de non-conformité, pour le rapport d'audit. */
  problems: string[];
}

/**
 * Analyse un objectif pédagogique selon la formule REWORK.
 *
 * Ne **juge pas** la pertinence pédagogique : vérifie la **forme**, qui est ce que
 * l'indicateur 5 rend vérifiable (« objectifs opérationnels et évaluables »).
 */
export function analyzeObjective(objective: string): ObjectiveAnalysis {
  const normalized = normalizeForSearch(objective);
  const problems: string[] = [];

  // 1. Verbe interdit — cherché en premier : c'est le défaut le plus grave, et il rend les
  //    autres contrôles sans objet.
  const forbiddenVerb =
    FORBIDDEN_VERBS.find((verb) => new RegExp(`(^|[^a-z])${normalizeForSearch(verb)}`, 'i').test(normalized)) ?? null;
  if (forbiddenVerb) {
    problems.push(
      `Verbe interdit « ${forbiddenVerb} » : non observable, donc non évaluable ` +
        '(exigence de l’indicateur 5 du RNQ).',
    );
  }

  // 2. Verbe d'action présent dans la liste Bloom.
  let verb: string | null = null;
  let level: BloomLevel | null = null;

  for (const candidate of BLOOM_LEVELS) {
    const normalizedVerbs = NORMALIZED_VERBS.get(candidate) ?? [];
    const found = BLOOM_VERBS[candidate].find((candidateVerb, index) =>
      new RegExp(`(^|[^a-z])${normalizedVerbs[index]}`).test(normalized),
    );

    if (found) {
      verb = found;
      level = candidate;
      break;
    }
  }

  if (!verb) {
    problems.push(
      'Aucun verbe d’action de la taxonomie de Bloom détecté : le niveau est indéterminable.',
    );
  }

  // 3. Conditions et critères, entre parenthèses (partie réservée au formateur).
  const hasCriteria = /\([^)]+\)/.test(objective);
  if (!hasCriteria) {
    problems.push(
      'Conditions et critères de réussite absents : ils doivent figurer entre parenthèses.',
    );
  }

  return {
    wellFormed: problems.length === 0,
    verb,
    level,
    forbiddenVerb,
    hasCriteria,
    problems,
  };
}

/**
 * Types de leçon cohérents avec chaque niveau de Bloom.
 *
 * ⚠️ **C'est la table R6** de `@docs/katalyst/regles-conformite.md`. Elle rend la règle R3
 * (« contenus adaptés aux objectifs ») **vérifiable automatiquement**.
 *
 * Principe : un QCM ne fait pas *créer*, une interaction ne fait pas *mémoriser*.
 */
export const BLOOM_ALLOWED_LESSON_TYPES: Record<BloomLevel, readonly string[]> = {
  Connaître: ['TEXTE', 'VIDEO', 'CAPSULE', 'EVALUATION'],
  Comprendre: ['TEXTE', 'IMAGE', 'CAPSULE', 'MISE_EN_PRATIQUE'],
  Appliquer: ['MISE_EN_PRATIQUE', 'MEDIA', 'AUDIO'],
  Analyser: ['MISE_EN_PRATIQUE', 'MEDIA'],
  Évaluer: ['MISE_EN_PRATIQUE', 'EVALUATION'],
  Créer: ['MISE_EN_PRATIQUE', 'MEDIA', 'LIEN'],
};

/** Indique si un couple (type de leçon, niveau de Bloom) est cohérent. */
export function isLessonTypeCompatibleWithBloom(lessonType: string, level: BloomLevel): boolean {
  return BLOOM_ALLOWED_LESSON_TYPES[level].includes(lessonType);
}

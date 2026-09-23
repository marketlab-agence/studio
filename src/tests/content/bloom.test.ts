/**
 * @jest-environment node
 *
 * Taxonomie de Bloom (règles R2 et R6) — `@docs/katalyst/regles-conformite.md`.
 *
 * Ces tests verrouillent la **détection** : c'est elle qui rend l'indicateur 5 vérifiable.
 * Une détection permissive ferait passer des objectifs non évaluables pour conformes — donc
 * masquerait exactement l'écart que l'audit doit révéler.
 */
import {
  analyzeObjective,
  BLOOM_ALLOWED_LESSON_TYPES,
  BLOOM_LEVELS,
  BLOOM_VERBS,
  FORBIDDEN_VERBS,
  isLessonTypeCompatibleWithBloom,
} from '@/lib/content/bloom';

describe('taxonomie — structure', () => {
  it('expose les 6 niveaux dans l’ordre officiel REWORK', () => {
    expect(BLOOM_LEVELS).toEqual([
      'Connaître',
      'Comprendre',
      'Appliquer',
      'Analyser',
      'Évaluer',
      'Créer',
    ]);
  });

  it('fournit des verbes pour chaque niveau', () => {
    // Un niveau sans verbe serait indétectable : la règle R2 serait inopérante pour lui.
    for (const level of BLOOM_LEVELS) {
      expect(BLOOM_VERBS[level].length).toBeGreaterThan(0);
    }
  });

  it('n’utilise pas un verbe interdit comme verbe d’action', () => {
    // Un verbe interdit ne doit pas pouvoir servir à détecter un niveau : il serait à la
    // fois accepté et refusé.
    const allVerbs = BLOOM_LEVELS.flatMap((level) => [...BLOOM_VERBS[level]]);
    for (const forbidden of FORBIDDEN_VERBS) {
      expect(allVerbs).not.toContain(forbidden);
    }
  });
});

describe('analyzeObjective', () => {
  it('accepte un objectif conforme et détecte son niveau', () => {
    const result = analyzeObjective(
      "L'apprenant sera capable de créer une branche Git (sans erreur ; en moins de 5 minutes)",
    );

    expect(result.wellFormed).toBe(true);
    expect(result.level).toBe('Créer');
    expect(result.verb).toBe('créer');
    expect(result.hasCriteria).toBe(true);
    expect(result.problems).toHaveLength(0);
  });

  it('détecte chaque niveau par son verbe', () => {
    const cas: [string, string][] = [
      ["L'apprenant sera capable d'énumérer les commandes Git (à l'oral)", 'Connaître'],
      ["L'apprenant sera capable d'expliquer le rôle de l'index (avec un schéma)", 'Comprendre'],
      ["L'apprenant sera capable d'exécuter un commit (sans aide)", 'Appliquer'],
      ["L'apprenant sera capable d'analyser un historique (en identifiant la cause)", 'Analyser'],
      ["L'apprenant sera capable d'évaluer deux stratégies de fusion (avec critères)", 'Évaluer'],
      ["L'apprenant sera capable de concevoir un workflow (conforme aux règles)", 'Créer'],
    ];

    for (const [objective, expected] of cas) {
      // `expect(valeur, message)` n'est pas typé dans cette version de Jest : le contexte
      // est porté par le libellé de l'assertion.
      expect({ objective, level: analyzeObjective(objective).level }).toEqual({
        objective,
        level: expected,
      });
    }
  });

  describe('verbes interdits', () => {
    it('refuse « comprendre » — non observable', () => {
      const result = analyzeObjective("L'apprenant sera capable de comprendre Git (en lisant)");

      expect(result.wellFormed).toBe(false);
      expect(result.forbiddenVerb).toBe('comprendre');
      expect(result.problems.join(' ')).toMatch(/Verbe interdit/);
      // Le motif doit citer l'indicateur : c'est ce qui rattache le constat à son exigence.
      expect(result.problems.join(' ')).toMatch(/indicateur 5/);
    });

    it('refuse « savoir »', () => {
      const result = analyzeObjective("L'apprenant sera capable de savoir fusionner (en cours)");

      expect(result.forbiddenVerb).toBe('savoir');
      expect(result.wellFormed).toBe(false);
    });

    it('refuse « connaître »', () => {
      // Piège : « Connaître » est un niveau Bloom, mais « connaître » est un verbe interdit.
      // Le niveau se détecte par d'autres verbes (énumérer, lister, nommer…).
      const result = analyzeObjective("L'apprenant sera capable de connaître Git (en cours)");

      expect(result.forbiddenVerb).toBe('connaître');
      expect(result.level).toBeNull();
    });

    it('ne confond pas un mot contenant le verbe interdit', () => {
      // « reconnaissance » contient « connaî… » mais n'est pas le verbe interdit.
      const result = analyzeObjective(
        "L'apprenant sera capable de réaliser la reconnaissance d'un dépôt (en 2 minutes)",
      );

      expect(result.forbiddenVerb).toBeNull();
    });
  });

  describe('conditions et critères', () => {
    it('exige des parenthèses', () => {
      const result = analyzeObjective("L'apprenant sera capable d'analyser un dépôt");

      expect(result.hasCriteria).toBe(false);
      expect(result.problems.join(' ')).toMatch(/parenthèses/);
      expect(result.wellFormed).toBe(false);
    });

    it('accepte des parenthèses non vides', () => {
      expect(analyzeObjective("L'apprenant sera capable de lister les commandes (5 minimum)").hasCriteria).toBe(true);
    });
  });

  it('signale un objectif vide par ses deux manques', () => {
    const result = analyzeObjective('');

    expect(result.wellFormed).toBe(false);
    expect(result.problems.length).toBeGreaterThanOrEqual(2);
  });

  it('est insensible à la casse', () => {
    expect(analyzeObjective("L'APPRENANT SERA CAPABLE DE CRÉER (TEST)").level).toBe('Créer');
  });
});

describe('cohérence type de leçon ↔ niveau (règle R6)', () => {
  it('refuse un QCM pour le niveau « Créer »', () => {
    // Un QCM ne fait pas créer l'apprenant : c'est l'incohérence que R6 doit détecter.
    expect(isLessonTypeCompatibleWithBloom('EVALUATION', 'Créer')).toBe(false);
  });

  it('refuse une mise en pratique pour le niveau « Connaître »', () => {
    // Une interaction n'est pas de la mémorisation.
    expect(isLessonTypeCompatibleWithBloom('MISE_EN_PRATIQUE', 'Connaître')).toBe(false);
  });

  it('accepte les couples attendus', () => {
    expect(isLessonTypeCompatibleWithBloom('EVALUATION', 'Connaître')).toBe(true);
    expect(isLessonTypeCompatibleWithBloom('MISE_EN_PRATIQUE', 'Créer')).toBe(true);
    expect(isLessonTypeCompatibleWithBloom('TEXTE', 'Comprendre')).toBe(true);
  });

  it('couvre les 6 niveaux et n’en laisse aucun sans type', () => {
    // Un niveau sans type admis rendrait toute leçon non conforme : impossible de le
    // satisfaire.
    for (const level of BLOOM_LEVELS) {
      expect(BLOOM_ALLOWED_LESSON_TYPES[level].length).toBeGreaterThan(0);
    }
  });

  it('autorise « Créer » par plusieurs voies', () => {
    // Créer peut se faire par une mise en pratique, un média ou une ressource externe.
    expect(BLOOM_ALLOWED_LESSON_TYPES.Créer.length).toBeGreaterThanOrEqual(2);
  });
});

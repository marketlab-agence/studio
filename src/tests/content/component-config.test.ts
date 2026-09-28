import { ComponentConfigSchema, fusionnerLibelles } from '@/lib/schemas/component-config';
import { COMPONENT_CATALOG, COMPONENT_CATALOG_BY_NAME } from '@/components/registry/catalog';
import { DATA_SCHEMAS, LABEL_KEYS } from '@/components/registry/component-schemas';

/**
 * Vérifie le contrat de configuration et l'exhaustivité des schémas.
 *
 * ⚠️ **L'exigence centrale** : chaque composant du catalogue déclare un schéma
 * strict ET des libellés personnalisables. Décision utilisateur : « un schéma
 * strict pour tous les 34 composants comme les 12 ». Aucun composant ne doit
 * échapper à la validation.
 */
describe('contrat de configuration', () => {
  it('accepte une configuration vide', () => {
    expect(ComponentConfigSchema.safeParse({}).success).toBe(true);
  });

  it('refuse des libellés non textuels', () => {
    expect(ComponentConfigSchema.safeParse({ labels: { titre: 42 } }).success).toBe(false);
  });

  it('complète les libellés manquants par les valeurs par défaut', () => {
    const resultat = fusionnerLibelles({ a: 'A', b: 'B' }, { b: 'B modifié' });
    expect(resultat).toEqual({ a: 'A', b: 'B modifié' });
  });

  it('rend les libellés par défaut si aucune configuration n’est fournie', () => {
    expect(fusionnerLibelles({ a: 'A' }, undefined)).toEqual({ a: 'A' });
  });

  it('déclare des libellés personnalisables pour CHAQUE composant', () => {
    // ⚠️ On lit la carte EXPORTÉE `LABEL_KEYS`, pas `meta.labelKeys` : `toMeta` retombe sur
    // `{}` quand l'entrée manque, si bien que filtrer sur `meta.labelKeys` ne pouvait
    // jamais échouer. Comparer les CLÉS des deux côtés est la seule vérification à dents.
    const noms = new Set(COMPONENT_CATALOG.map((meta) => meta.name));
    const orphelins = Object.keys(LABEL_KEYS).filter((nom) => !noms.has(nom));
    const manquants = COMPONENT_CATALOG
      .filter((meta) => !(meta.name in LABEL_KEYS))
      .map((meta) => meta.name);
    expect(orphelins).toEqual([]);
    expect(manquants).toEqual([]);
  });

  it('déclare un schéma de données pour CHAQUE composant', () => {
    // ⚠️ Même raisonnement : `toMeta` garantit `dataSchema` non nul, donc `!meta.dataSchema`
    // était tautologique. On exige que la carte `DATA_SCHEMAS` couvre exactement le catalogue.
    const noms = new Set(COMPONENT_CATALOG.map((meta) => meta.name));
    const orphelins = Object.keys(DATA_SCHEMAS).filter((nom) => !noms.has(nom));
    const manquants = COMPONENT_CATALOG
      .filter((meta) => !(meta.name in DATA_SCHEMAS))
      .map((meta) => meta.name);
    expect(orphelins).toEqual([]);
    expect(manquants).toEqual([]);
  });

  it('expose des libellés par défaut en français, non vides', () => {
    for (const meta of COMPONENT_CATALOG) {
      for (const [cle, valeur] of Object.entries(meta.labelKeys)) {
        if (typeof valeur !== 'string' || valeur.trim() === '') {
          throw new Error(`Libellé vide ou non textuel : ${meta.name}.${cle}`);
        }
      }
    }
    // Le parcours ci-dessus lève si un libellé est vide ; arriver ici est la preuve.
    expect(COMPONENT_CATALOG.length).toBeGreaterThan(0);
  });

  it('refuse une donnée qui ne respecte pas le schéma du composant', () => {
    const meta = COMPONENT_CATALOG_BY_NAME.MatchingPairs;
    // `pairs` vide : aucune paire à associer, l'exercice n'a pas de sens.
    expect(meta.dataSchema.safeParse({ pairs: [] }).success).toBe(false);
    // ⚠️ `id` est requis : le composant l'utilise comme clé et pour la trace. Un schéma qui
    // l'omettrait accepterait des données que le composant ne saurait pas rendre.
    expect(meta.dataSchema.safeParse({ pairs: [{ id: 'p1', left: 'a', right: 'b' }] }).success).toBe(true);
    expect(meta.dataSchema.safeParse({ pairs: [{ left: 'a', right: 'b' }] }).success).toBe(false);
  });

  it('indexe chaque composant par son nom', () => {
    expect(Object.keys(COMPONENT_CATALOG_BY_NAME).length).toBe(COMPONENT_CATALOG.length);
  });
});

/**
 * ⚠️ **Le contrat qui rend la validation utile.** Un schéma qui ne décrit pas ce que le
 * composant lit réellement dans `config.data` est pire qu'absent : il laisse l'écriture (T7)
 * produire, et l'audit (R9/T8) accepter, des données qu'aucun rendu n'affichera.
 *
 * Chaque échantillon ci-dessous est **la forme que le composant consomme** (celle des props
 * de la primitive, projetée). Le test échoue dès qu'un schéma dérive de son composant.
 */
describe('DATA_SCHEMAS — alignés sur les données réellement lues par les composants', () => {
  /**
   * ⚠️ **Périmètre verrouillé.** Les composants dont `config.data` est réellement **consommée**
   * au rendu : les 12 primitives + les configurations Git câblées sur une primitive
   * (`GitDoctorTool`, `MergeSimulator`, `UndoCommandComparison`, `ConflictVisualizer`,
   * `StagingAreaVisualizer`, `GitRepositoryPlayground`) + `GitCommandSimulator`.
   *
   * Les composants spécialisés non data-driven (lots 2 paquets 1 et 2 : `GitTimeTravel`,
   * `ReflogExplorer`, `ResolutionGuide`, `ForkVsCloneDemo`, `TrunkBasedDevelopmentVisualizer`,
   * `PullRequestCreator`, `WorkflowDesigner`, `CollaborationSimulator`, `ConflictPlayground`,
   * `TimelineNavigator`) sont hors de ce périmètre : leur rendu n'exploite aucune donnée
   * structurée. Ils sont couverts par le bloc « aucune donnée attendue » plus bas.
   */
  const PERIMETRE = [
    // 12 primitives
    'StepByStepRunner',
    'GuidedProcedure',
    'RecallQuiz',
    'FlashcardDrill',
    'SortingGame',
    'MatchingPairs',
    'CaseDiagnosis',
    'CompareContrast',
    'DecisionScenario',
    'PeerReviewSimulator',
    'BuilderCanvas',
    'DraftCoach',
    // configurations Git réellement câblées sur une primitive
    'GitCommandSimulator',
    'GitDoctorTool',
    'MergeSimulator',
    'UndoCommandComparison',
    'ConflictVisualizer',
    'StagingAreaVisualizer',
  ] as const;

  /** Échantillon = exactement la forme que le composant consomme (props de la primitive, projetée). */
  const ECHANTILLONS: Record<string, unknown> = {
    StepByStepRunner: { steps: [{ id: 's1', instruction: 'Fais X', expected: 'x' }] },
    GuidedProcedure: { checkpoints: [{ id: 'c1', label: 'Vérifie', detail: 'Détail', requiresInput: true }] },
    RecallQuiz: {
      questions: [
        {
          id: 'q1',
          text: 'Question ?',
          answers: [{ id: 'a1', text: 'Bonne', isCorrect: true }],
        },
      ],
    },
    FlashcardDrill: { cards: [{ id: 'f1', front: 'Face', back: 'Dos' }] },
    SortingGame: {
      categories: [{ id: 'cat1', label: 'Catégorie', explanation: 'Pourquoi' }],
      items: [{ id: 'i1', label: 'Élément', categoryId: 'cat1', hint: 'Indice' }],
    },
    MatchingPairs: { pairs: [{ id: 'p1', left: 'Gauche', right: 'Droite', explanation: 'Lien' }] },
    CaseDiagnosis: {
      situation: 'Un cas',
      clues: [{ id: 'cl1', label: 'Indice', relevant: true, significance: 'Ce que ça révèle' }],
      causes: [{ id: 'ca1', label: 'Cause A' }, { id: 'ca2', label: 'Cause B' }],
      correctCauseId: 'ca1',
    },
    CompareContrast: {
      optionA: { id: 'a', label: 'Option A', description: 'Desc A' },
      optionB: { id: 'b', label: 'Option B' },
      criteria: [{ id: 'cr1', label: 'Critère', guidance: 'À observer' }],
      expectedConclusion: 'Attendu',
    },
    DecisionScenario: {
      scenario: 'Un scénario',
      options: [{ id: 'o1', label: 'Choix', pros: ['+'], cons: ['-'], quality: 'best', feedback: 'Pourquoi' }],
    },
    PeerReviewSimulator: {
      workToReview: 'À évaluer',
      criteria: [{ id: 'r1', label: 'Critère', guidance: 'Ce qu’on regarde' }],
    },
    BuilderCanvas: {
      sections: [{ id: 'sec1', label: 'Rubrique', prompt: 'Consigne', placeholder: 'ex.', required: true }],
    },
    DraftCoach: {
      prompt: 'Consigne',
      example: 'Repère',
      criteria: [{ id: 'd1', label: 'Critère', guidance: 'Ce qu’on vérifie', pattern: 'motif' }],
    },

    // --- Configurations Git : même forme que la primitive cible (transmission verbatim) ---
    GitCommandSimulator: { steps: [{ id: 's1', instruction: 'Fais X', expected: 'x' }] },
    GitDoctorTool: {
      situation: 'Un cas',
      clues: [{ id: 'cl1', label: 'Indice', relevant: true }],
      causes: [{ id: 'ca1', label: 'Cause A' }, { id: 'ca2', label: 'Cause B' }],
      correctCauseId: 'ca1',
    },
    // MergeSimulator → MergeStrategyComparison → CompareContrast
    MergeSimulator: {
      optionA: { id: 'ff', label: 'Fast-forward' },
      optionB: { id: 'mc', label: 'Merge commit' },
      criteria: [{ id: 'history', label: 'Lisibilité' }],
    },
    // UndoCommandComparison → UndoCommandComparisonConfig → CompareContrast
    UndoCommandComparison: {
      optionA: { id: 'revert', label: 'git revert' },
      optionB: { id: 'reset', label: 'git reset' },
      criteria: [{ id: 'shared', label: 'Historique partagé' }],
    },
    ConflictVisualizer: {
      categories: [{ id: 'cat1', label: 'Catégorie' }],
      items: [{ id: 'i1', label: 'Élément', categoryId: 'cat1' }],
    },
    StagingAreaVisualizer: {
      categories: [{ id: 'cat1', label: 'Catégorie' }],
      items: [{ id: 'i1', label: 'Élément', categoryId: 'cat1' }],
    },
  };

  it('couvre EXACTEMENT les composants dont `config.data` est consommée', () => {
    // ⚠️ Un nom manquant est précisément la faille qui a laissé passer une dérive silencieuse.
    expect(Object.keys(ECHANTILLONS).sort()).toEqual([...PERIMETRE].sort());
    for (const nom of PERIMETRE) {
      expect(COMPONENT_CATALOG_BY_NAME[nom]).toBeDefined();
    }
  });

  it('accepte la forme réellement consommée par chaque composant', () => {
    const incoherents: string[] = [];

    for (const [nom, donnees] of Object.entries(ECHANTILLONS)) {
      const meta = COMPONENT_CATALOG_BY_NAME[nom];
      if (!meta) throw new Error(`Composant inconnu du catalogue : ${nom}`);
      if (!meta.dataSchema.safeParse(donnees).success) incoherents.push(nom);
    }

    // Le tableau nomme le composant fautif : le diagnostic est immédiat si un schéma dérive.
    expect(incoherents).toEqual([]);
  });

  it('refuse les anciennes formes erronées des configurations Git réalignées', () => {
    // ⚠️ Ces formes étaient acceptées avant la correction : elles sont inutilisables par la
    // primitive cible. Le test les rejette pour empêcher tout retour en arrière.
    const ANCIENNES: Record<string, unknown> = {
      MergeSimulator: { branches: ['main', 'feature'] },
      UndoCommandComparison: { criteria: ['Historique partagé'] },
    };

    const encoreAcceptees = Object.entries(ANCIENNES)
      .filter(([nom, donnees]) => COMPONENT_CATALOG_BY_NAME[nom].dataSchema.safeParse(donnees).success)
      .map(([nom]) => nom);

    expect(encoreAcceptees).toEqual([]);
  });
});

/**
 * ⚠️ **L'autre moitié de la vérité du schéma (lot 2).** Un composant qui affiche un contenu en
 * dur — sans exploiter `config.data` — doit déclarer un schéma **vide**. L'ancienne forme
 * (`{ pairs }`, `{ steps }`, `{ checkpoints }`, forme `CompareContrast`…) décrivait la
 * configuration d'une variante **morte** : le créateur et l'IA pouvaient éditer une donnée
 * silencieusement ignorée au rendu.
 *
 * Le test échoue si l'on réintroduit une clé : il verrouille le réalignement.
 */
describe('DATA_SCHEMAS — composants spécialisés non data-driven : aucune donnée attendue', () => {
  const SANS_DONNEES = [
    'GitTimeTravel',
    'ReflogExplorer',
    'ResolutionGuide',
    'ForkVsCloneDemo',
    'TrunkBasedDevelopmentVisualizer',
    'PullRequestCreator',
    'WorkflowDesigner',
    'CollaborationSimulator',
    'ConflictPlayground',
    'TimelineNavigator',
    'BranchCreator',
    'ConflictResolver',
    'PRWorkflowSimulator',
    'IssueTracker',
    'VersioningDemo',
    'AliasCreator',
    'CommitMessageLinter',
    'GitignoreTester',
    'SecurityScanner',
    'PushPullAnimator',
    'GitRepositoryPlayground',
    'AiHelper',
    'ActionsWorkflowBuilder',
    'FlowDiagramBuilder',
    'GitHubInterfaceSimulator',
    'OpenSourceSimulator',
    'WorkflowSimulator',
  ] as const;

  it('déclarent un schéma objet sans aucune clé', () => {
    for (const nom of SANS_DONNEES) {
      expect(COMPONENT_CATALOG_BY_NAME[nom]).toBeDefined();
      const schema = DATA_SCHEMAS[nom];
      const shape = (schema as unknown as { shape?: Record<string, unknown> }).shape;
      // Un schéma non-objet n'a pas de `shape` : le message nomme alors le composant fautif.
      expect({ nom, cles: Object.keys(shape ?? {}) }).toEqual({ nom, cles: [] });
      // Aucune donnée n'est requise : `{}` est valide.
      expect(schema.safeParse({}).success).toBe(true);
    }
  });
});

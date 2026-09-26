import { ComponentConfigSchema, fusionnerLibelles } from '@/lib/schemas/component-config';
import { COMPONENT_CATALOG, COMPONENT_CATALOG_BY_NAME } from '@/components/registry/catalog';

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
    const sansLibelles = COMPONENT_CATALOG.filter(
      (meta) => Object.keys(meta.labelKeys).length === 0,
    ).map((meta) => meta.name);
    expect(sansLibelles).toEqual([]);
  });

  it('déclare un schéma de données pour CHAQUE composant', () => {
    const sansSchema = COMPONENT_CATALOG.filter((meta) => !meta.dataSchema).map((m) => m.name);
    expect(sansSchema).toEqual([]);
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
    // Configurations Git : même forme que leur primitive (transmission verbatim).
    GitCommandSimulator: { steps: [{ id: 's1', instruction: 'Fais X', expected: 'x' }] },
    GitDoctorTool: {
      situation: 'Un cas',
      clues: [{ id: 'cl1', label: 'Indice', relevant: true }],
      causes: [{ id: 'ca1', label: 'Cause A' }, { id: 'ca2', label: 'Cause B' }],
      correctCauseId: 'ca1',
    },
    GitTimeTravel: { pairs: [{ id: 'p1', left: 'Gauche', right: 'Droite' }] },
    StagingAreaVisualizer: {
      categories: [{ id: 'cat1', label: 'Catégorie' }],
      items: [{ id: 'i1', label: 'Élément', categoryId: 'cat1' }],
    },
    ConflictVisualizer: {
      categories: [{ id: 'cat1', label: 'Catégorie' }],
      items: [{ id: 'i1', label: 'Élément', categoryId: 'cat1' }],
    },
    ReflogExplorer: { steps: [{ id: 's1', instruction: 'Fais X', expected: 'x' }] },
    ResolutionGuide: { checkpoints: [{ id: 'c1', label: 'Vérifie', detail: 'Détail' }] },
    ForkVsCloneDemo: {
      optionA: { id: 'a', label: 'Option A' },
      optionB: { id: 'b', label: 'Option B' },
      criteria: [{ id: 'cr1', label: 'Critère', guidance: 'À observer' }],
    },
    TrunkBasedDevelopmentVisualizer: {
      optionA: { id: 'a', label: 'Option A' },
      optionB: { id: 'b', label: 'Option B' },
      criteria: [{ id: 'cr1', label: 'Critère', guidance: 'À observer' }],
    },
    CollaborationSimulator: { scenario: 'Un scénario', options: [{ id: 'o1', label: 'Choix' }] },
    PullRequestCreator: { prompt: 'Consigne', criteria: [{ id: 'd1', label: 'Critère', guidance: 'Vérif' }] },
    WorkflowDesigner: { blocks: ['Rubrique A', 'Rubrique B'] },
    GitRepositoryPlayground: { blocks: ['Rubrique A'] },
  };

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
});

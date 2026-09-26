import { z } from 'zod';

/**
 * Schémas stricts de configuration, **un par composant**.
 *
 * ⚠️ **Pourquoi ce fichier est séparé de `catalog.ts`.** Le catalogue décrit *ce
 * qu'est* un composant (nature, domaine, Bloom) ; ce fichier décrit *ce qu'il
 * attend* (structure des données). Les deux évoluent séparément : ajouter un
 * composant ne devrait pas obliger à relire 600 lignes de définitions.
 *
 * ⚠️ **Chaque entrée doit couvrir un composant réel du catalogue** : un test le
 * vérifie (`component-config.test.ts`). Un composant sans schéma serait une
 * configuration non validée — exactement ce que l'utilisateur a refusé.
 */

const Etape = z.object({
  id: z.string().min(1),
  instruction: z.string().min(1),
  expected: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
});

const Carte = z.object({ id: z.string().min(1), front: z.string().min(1), back: z.string().min(1) });
const Paire = z.object({
  id: z.string().min(1),
  left: z.string().min(1),
  right: z.string().min(1),
  explanation: z.string().optional(),
});
const CategorieTri = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  explanation: z.string().optional(),
});
const ItemTrie = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  categoryId: z.string().min(1),
  hint: z.string().optional(),
});
const Checkpoint = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  // ⚠️ Le composant lit `detail`, pas `description` : le schéma doit décrire ce qui est rendu.
  detail: z.string().optional(),
  requiresInput: z.boolean().optional(),
});

/**
 * Question de `RecallQuiz`.
 * ⚠️ La forme suit exactement ce que le composant rend : un `id`, un `text` et des `answers`
 * typées. `isCorrect` et `explanation` sont tolérés par le composant (le premier peut être faux
 * partout, la seconde peut manquer) : ils restent donc optionnels côté schéma.
 */
const QuestionRappel = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  answers: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
        isCorrect: z.boolean().optional(),
      }),
    )
    .min(1),
  isMultipleChoice: z.boolean().optional(),
  explanation: z.string().optional(),
});

/** Cause de `CaseDiagnosis` : le composant ne lit que `id` et `label`. */
const CauseDiagnostic = z.object({ id: z.string().min(1), label: z.string().min(1) });

const IndiceDiagnostic = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  relevant: z.boolean(),
  significance: z.string().optional(),
});

const OptionComparaison = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

const CritereComparaison = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  guidance: z.string().optional(),
});

const OptionDecision = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  pros: z.array(z.string().min(1)).optional(),
  cons: z.array(z.string().min(1)).optional(),
  quality: z.enum(['best', 'acceptable', 'poor']).nullish(),
  feedback: z.string().optional(),
});

const CritereRevue = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  guidance: z.string().min(1),
});

const CritereRedaction = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  guidance: z.string().min(1),
  pattern: z.string().optional(),
});

/** Rubrique de `BuilderCanvas` : le composant lit `id`, `label`, `prompt`, `placeholder`, `required`. */
const RubriqueCanevas = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  prompt: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
});

/** Chaînes non vides : une liste vide n'a pas de sens pédagogique. */
const Textes = z.array(z.string().min(1)).min(1);

const BlocRepetable = z.object({
  label: z.string().min(1),
  max: z.number().int().positive().optional(),
});

/**
 * Schémas par nom de composant.
 *
 * ⚠️ **Chaque schéma décrit EXACTEMENT les données que le composant lit dans `config.data`.**
 * Un schéma qui ne correspond pas au rendu rendrait la validation (écriture Task 7, audit R9
 * Task 8) trompeuse : elle accepterait des données qu'aucun composant ne saurait afficher.
 *
 * ⚠️ **Un composant absent reçoit `z.object({})`** — il n'accepte alors aucune
 * donnée structurée. C'est un repli sûr, mais le test exige que **les 58**
 * composants du catalogue soient couverts explicitement.
 */
export const DATA_SCHEMAS: Record<string, z.ZodType> = {
  // --- Les 12 primitives génériques ---
  StepByStepRunner: z.object({ steps: z.array(Etape).min(1) }),
  GuidedProcedure: z.object({ checkpoints: z.array(Checkpoint).min(1) }),
  RecallQuiz: z.object({ questions: z.array(QuestionRappel).min(1) }),
  FlashcardDrill: z.object({ cards: z.array(Carte).min(1) }),
  SortingGame: z.object({
    categories: z.array(CategorieTri).min(1),
    items: z.array(ItemTrie).min(1),
  }),
  MatchingPairs: z.object({ pairs: z.array(Paire).min(1) }),
  CaseDiagnosis: z.object({
    situation: z.string().min(1),
    clues: z.array(IndiceDiagnostic).min(1),
    causes: z.array(CauseDiagnostic).min(2),
    correctCauseId: z.string().min(1),
  }),
  CompareContrast: z.object({
    optionA: OptionComparaison,
    optionB: OptionComparaison,
    criteria: z.array(CritereComparaison).min(1),
    expectedConclusion: z.string().optional(),
  }),
  DecisionScenario: z.object({
    scenario: z.string().min(1),
    options: z.array(OptionDecision).min(1),
  }),
  PeerReviewSimulator: z.object({
    workToReview: z.string().min(1),
    criteria: z.array(CritereRevue).min(1),
  }),
  BuilderCanvas: z.object({
    sections: z.array(RubriqueCanevas).min(1).optional(),
    blocks: Textes.optional(),
    repeatable: BlocRepetable.optional(),
  }),
  DraftCoach: z.object({
    prompt: z.string().min(1),
    example: z.string().optional(),
    criteria: z.array(CritereRedaction).optional(),
  }),

  // --- Configurations Git (elles dérivent les données des primitives) ---
  // ⚠️ Une configuration qui transmet `config` à une primitive décrit **la même forme** que
  // cette primitive : c'est ce qui rend la validation à l'écriture et à l'audit significative.
  GitCommandSimulator: z.object({ steps: z.array(Etape).min(1) }),
  GitRepositoryPlayground: z.object({ blocks: Textes }),
  GitTimeTravel: z.object({ pairs: z.array(Paire).min(1) }),
  GitDoctorTool: z.object({
    situation: z.string().min(1),
    clues: z.array(IndiceDiagnostic).min(1),
    causes: z.array(CauseDiagnostic).min(2),
    correctCauseId: z.string().min(1),
  }),
  StagingAreaVisualizer: z.object({
    categories: z.array(CategorieTri).min(1),
    items: z.array(ItemTrie).min(1),
  }),
  VersioningDemo: z.object({ commits: Textes }),
  BranchCreator: z.object({ branches: z.array(z.string().min(1)).optional() }),
  MergeSimulator: z.object({ branches: Textes }),
  ConflictPlayground: z.object({ files: Textes }),
  ConflictVisualizer: z.object({
    categories: z.array(CategorieTri).min(1),
    items: z.array(ItemTrie).min(1),
  }),
  ConflictResolver: z.object({ files: Textes }),
  ResolutionGuide: z.object({ checkpoints: z.array(Checkpoint).min(1) }),
  PushPullAnimator: z.object({ steps: z.array(Etape).min(1) }),
  ForkVsCloneDemo: z.object({
    optionA: OptionComparaison,
    optionB: OptionComparaison,
    criteria: z.array(CritereComparaison).min(1),
    expectedConclusion: z.string().optional(),
  }),
  PRWorkflowSimulator: z.object({ steps: z.array(Etape).min(1) }),
  PullRequestCreator: z.object({
    prompt: z.string().min(1),
    example: z.string().optional(),
    criteria: z.array(CritereRedaction).optional(),
  }),
  GitHubInterfaceSimulator: z.object({ blocks: Textes }),
  IssueTracker: z.object({ items: z.array(ItemTrie).min(1) }),
  ActionsWorkflowBuilder: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowSimulator: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowDesigner: z.object({
    sections: z.array(RubriqueCanevas).min(1).optional(),
    blocks: Textes.optional(),
    repeatable: BlocRepetable.optional(),
  }),
  FlowDiagramBuilder: z.object({ blocks: Textes }),
  TrunkBasedDevelopmentVisualizer: z.object({
    optionA: OptionComparaison,
    optionB: OptionComparaison,
    criteria: z.array(CritereComparaison).min(1),
    expectedConclusion: z.string().optional(),
  }),
  ReflogExplorer: z.object({ steps: z.array(Etape).min(1) }),
  TimelineNavigator: z.object({ commits: Textes }),
  UndoCommandComparison: z.object({ criteria: Textes }),
  CommitMessageLinter: z.object({ examples: Textes }),
  GitignoreTester: z.object({ patterns: Textes }),
  AliasCreator: z.object({ examples: z.array(z.string().min(1)).optional() }),
  SecurityScanner: z.object({ patterns: Textes }),
  CollaborationSimulator: z.object({
    scenario: z.string().min(1),
    options: z.array(OptionDecision).min(1),
  }),
  OpenSourceSimulator: z.object({ steps: z.array(Etape).min(1) }),
  AiHelper: z.object({ prompt: z.string().min(1) }),

  // --- Composants visuels (illustratifs, sans obligation de niveau Bloom) ---
  GitGraph: z.object({ commits: Textes }),
  BranchDiagram: z.object({ branches: Textes }),
  CommitTimeline: z.object({ commits: Textes }),
  AnimatedFlow: z.object({ steps: z.array(Etape).min(1) }),
  ConceptDiagram: z.object({ blocks: Textes }),
  ConceptExplanation: z.object({ blocks: Textes }),
  DiffViewer: z.object({ files: Textes }),
  FileTreeViewer: z.object({ files: Textes }),
  RepoComparison: z.object({ criteria: Textes }),
  WorkflowComparisonTable: z.object({ criteria: Textes }),
  LanguagesChart: z.object({ entries: Textes }),
  StatisticsChart: z.object({ entries: Textes }),
  ProjectDashboard: z.object({ entries: Textes }),
};

/**
 * Libellés personnalisables, par nom de composant (valeurs par défaut en français).
 *
 * ⚠️ **Le catalogue expose ce qui est personnalisable** — ni plus, ni moins. L'IA
 * sait ainsi *quels* libellés produire pour une formation anglophone, et le
 * formulaire ne propose pas de modifier un texte qui n'existe pas.
 */
export const LABEL_KEYS: Record<string, Record<string, string>> = {
  // --- Les 12 primitives ---
  StepByStepRunner: { title: 'Procédure guidée', description: 'Exécute les étapes dans l’ordre.' },
  GuidedProcedure: { title: 'Procédure guidée', description: 'Valide chaque point de contrôle.' },
  RecallQuiz: { title: 'Quiz de rappel', description: 'Vérifie ce que tu retiens.' },
  FlashcardDrill: { title: 'Cartes mémoire', description: 'Retourne la carte pour vérifier.' },
  SortingGame: { title: 'Tri par catégorie', description: 'Classe chaque élément.' },
  MatchingPairs: { title: 'Associe les paires', description: 'Relie ce qui va ensemble.' },
  CaseDiagnosis: { title: 'Diagnostic de cas', description: 'Trouve la cause.' },
  CompareContrast: { title: 'Compare et contraste', description: 'Confronte les options.' },
  DecisionScenario: { title: 'Scénario de décision', description: 'Choisis la meilleure option.' },
  PeerReviewSimulator: { title: 'Revue par les pairs', description: 'Évalue selon la grille.' },
  BuilderCanvas: { title: 'Construis ton artefact', description: 'Assemble les blocs.' },
  DraftCoach: { title: 'Rédaction guidée', description: 'Rédige, reçois un retour, corrige.' },

  // --- Configurations Git ---
  GitCommandSimulator: { title: 'Commandes Git essentielles', description: 'Exécute la procédure dans l’ordre.' },
  GitRepositoryPlayground: { title: 'Dépôt à construire', description: 'Crée ton dépôt.' },
  GitTimeTravel: { title: 'Voyage dans l’historique', description: 'Explore les versions.' },
  GitDoctorTool: { title: 'Diagnostic de dépôt', description: 'Répare un état anormal.' },
  StagingAreaVisualizer: { title: 'Zone de staging', description: 'Suis l’état des fichiers.' },
  VersioningDemo: { title: 'Le versioning en action', description: 'Crée des versions.' },
  BranchCreator: { title: 'Création de branches', description: 'Crée et gère les branches.' },
  MergeSimulator: { title: 'Fusion de branches', description: 'Combine le travail.' },
  ConflictPlayground: { title: 'Terrain de conflit', description: 'Provoque un conflit.' },
  ConflictVisualizer: { title: 'Visualise le conflit', description: 'Comprends l’origine.' },
  ConflictResolver: { title: 'Résous le conflit', description: 'Répare le conflit.' },
  ResolutionGuide: { title: 'Guide de résolution', description: 'Suis la procédure.' },
  PushPullAnimator: { title: 'Push et Pull', description: 'Synchronise avec le distant.' },
  ForkVsCloneDemo: { title: 'Fork ou Clone ?', description: 'Choisis la bonne approche.' },
  PRWorkflowSimulator: { title: 'Cycle d’une Pull Request', description: 'Suis le parcours complet.' },
  PullRequestCreator: { title: 'Créer une Pull Request', description: 'Propose tes changements.' },
  GitHubInterfaceSimulator: { title: 'Interface de GitHub', description: 'Repère les éléments.' },
  IssueTracker: { title: 'Suivi des tâches', description: 'Crée et gère les issues.' },
  ActionsWorkflowBuilder: { title: 'GitHub Actions', description: 'Automatise ton flux.' },
  WorkflowSimulator: { title: 'Simulateur de workflow', description: 'Exécute le flux.' },
  WorkflowDesigner: { title: 'Concevoir un workflow', description: 'Organise les étapes.' },
  FlowDiagramBuilder: { title: 'Construis le diagramme', description: 'Représente le flux.' },
  TrunkBasedDevelopmentVisualizer: { title: 'Trunk-Based Development', description: 'Comprends le flux minimaliste.' },
  ReflogExplorer: { title: 'Explorateur de reflog', description: 'Retrouve les commits perdus.' },
  TimelineNavigator: { title: 'Navigateur de timeline', description: 'Voyage dans le temps.' },
  UndoCommandComparison: { title: 'Annuler : quelle commande ?', description: 'Choisis la bonne annulation.' },
  CommitMessageLinter: { title: 'Messages de commit', description: 'Rédige un message clair.' },
  GitignoreTester: { title: 'Tester .gitignore', description: 'Vérifie les règles.' },
  AliasCreator: { title: 'Créer des alias', description: 'Raccourcis tes commandes.' },
  SecurityScanner: { title: 'Scanner de secrets', description: 'Détecte les données sensibles.' },
  CollaborationSimulator: { title: 'Collaboration', description: 'Travaille à plusieurs.' },
  OpenSourceSimulator: { title: 'Contribuer à l’open source', description: 'Suis le processus complet.' },
  AiHelper: { title: 'Assistant IA', description: 'Pose ta question.' },

  // --- Composants visuels (illustratifs) ---
  GitGraph: { title: 'Graphe Git', description: 'Visualise l’historique.' },
  BranchDiagram: { title: 'Diagramme des branches', description: 'Comprends les branches.' },
  CommitTimeline: { title: 'Chronologie des commits', description: 'Situe les commits.' },
  AnimatedFlow: { title: 'Flux animé', description: 'Suis le mouvement.' },
  ConceptDiagram: { title: 'Schéma de concept', description: 'Rends le concept lisible.' },
  ConceptExplanation: { title: 'Explication illustrée', description: 'Comprends rapidement.' },
  DiffViewer: { title: 'Vue des différences', description: 'Compare les versions.' },
  FileTreeViewer: { title: 'Arborescence', description: 'Situe les fichiers.' },
  RepoComparison: { title: 'Comparaison de dépôts', description: 'Confronte deux approches.' },
  WorkflowComparisonTable: { title: 'Tableau comparatif', description: 'Compare les workflows.' },
  LanguagesChart: { title: 'Répartition des langages', description: 'Visualise la composition.' },
  StatisticsChart: { title: 'Statistiques', description: 'Visualise les chiffres.' },
  ProjectDashboard: { title: 'Tableau de bord projet', description: 'Suis l’avancement.' },
};

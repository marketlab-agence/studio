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

const Carte = z.object({ front: z.string().min(1), back: z.string().min(1) });
const Paire = z.object({ left: z.string().min(1), right: z.string().min(1) });
const ItemTrie = z.object({ label: z.string().min(1), category: z.string().min(1) });
const Checkpoint = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

/** Chaînes non vides : une liste vide n'a pas de sens pédagogique. */
const Textes = z.array(z.string().min(1)).min(1);

/**
 * Schémas par nom de composant.
 *
 * ⚠️ **Un composant absent reçoit `z.object({})`** — il n'accepte alors aucune
 * donnée structurée. C'est un repli sûr, mais le test exige que **les 58**
 * composants du catalogue soient couverts explicitement.
 */
export const DATA_SCHEMAS: Record<string, z.ZodType> = {
  // --- Les 12 primitives génériques ---
  StepByStepRunner: z.object({ steps: z.array(Etape).min(1) }),
  GuidedProcedure: z.object({ checkpoints: z.array(Checkpoint).min(1) }),
  RecallQuiz: z.object({
    questions: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
  }),
  FlashcardDrill: z.object({ cards: z.array(Carte).min(1) }),
  SortingGame: z.object({ categories: Textes, items: z.array(ItemTrie).min(1) }),
  MatchingPairs: z.object({ pairs: z.array(Paire).min(1) }),
  CaseDiagnosis: z.object({
    symptoms: Textes,
    causes: z.array(z.object({ label: z.string().min(1), correct: z.boolean() })).min(1),
  }),
  CompareContrast: z.object({ criteria: Textes }),
  DecisionScenario: z.object({ choices: Textes }),
  PeerReviewSimulator: z.object({ rubric: Textes }),
  BuilderCanvas: z.object({ blocks: Textes }),
  DraftCoach: z.object({ prompt: z.string().min(1) }),

  // --- Configurations Git (elles dérivent les données des primitives) ---
  GitCommandSimulator: z.object({ steps: z.array(Etape).min(1) }),
  GitRepositoryPlayground: z.object({ blocks: Textes }),
  GitTimeTravel: z.object({ commits: Textes }),
  GitDoctorTool: z.object({ symptoms: Textes }),
  StagingAreaVisualizer: z.object({ files: Textes }),
  VersioningDemo: z.object({ commits: Textes }),
  BranchCreator: z.object({ branches: z.array(z.string().min(1)).optional() }),
  MergeSimulator: z.object({ branches: Textes }),
  ConflictPlayground: z.object({ files: Textes }),
  ConflictVisualizer: z.object({ files: Textes }),
  ConflictResolver: z.object({ files: Textes }),
  ResolutionGuide: z.object({ steps: z.array(Etape).min(1) }),
  PushPullAnimator: z.object({ steps: z.array(Etape).min(1) }),
  ForkVsCloneDemo: z.object({ criteria: Textes }),
  PRWorkflowSimulator: z.object({ steps: z.array(Etape).min(1) }),
  PullRequestCreator: z.object({ steps: z.array(Etape).min(1) }),
  GitHubInterfaceSimulator: z.object({ blocks: Textes }),
  IssueTracker: z.object({ items: z.array(ItemTrie).min(1) }),
  ActionsWorkflowBuilder: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowSimulator: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowDesigner: z.object({ blocks: Textes }),
  FlowDiagramBuilder: z.object({ blocks: Textes }),
  TrunkBasedDevelopmentVisualizer: z.object({ steps: z.array(Etape).min(1) }),
  ReflogExplorer: z.object({ commits: Textes }),
  TimelineNavigator: z.object({ commits: Textes }),
  UndoCommandComparison: z.object({ criteria: Textes }),
  CommitMessageLinter: z.object({ examples: Textes }),
  GitignoreTester: z.object({ patterns: Textes }),
  AliasCreator: z.object({ examples: z.array(z.string().min(1)).optional() }),
  SecurityScanner: z.object({ patterns: Textes }),
  CollaborationSimulator: z.object({ steps: z.array(Etape).min(1) }),
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

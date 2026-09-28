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
  // ⚠️ Lot final : `GitRepositoryPlayground` est rendu par le composant **spécialisé** (arbre de
  // fichiers statique), qui n'expose aucune donnée structurée. L'ancienne forme (`BuilderCanvas`)
  // décrivait la configuration morte de la variante non câblée.
  GitRepositoryPlayground: z.object({}),
  // ⚠️ Lot 2 : `GitTimeTravel` est rendu par le composant **spécialisé** (machine à remonter le
  // temps), qui n'expose aucune donnée structurée configurable. Le schéma vide dit la vérité du
  // rendu : aucune donnée n'est attendue (l'ancien `{ pairs }` décrivait la configuration morte).
  GitTimeTravel: z.object({}),
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
  VersioningDemo: z.object({}),
  BranchCreator: z.object({}),
  // ⚠️ `MergeSimulator` est enregistré sur `MergeStrategyComparison`, qui transmet `config`
  // à `CompareContrast` : le schéma doit donc décrire la forme de `CompareContrast`.
  MergeSimulator: z.object({
    optionA: OptionComparaison,
    optionB: OptionComparaison,
    criteria: z.array(CritereComparaison).min(1),
    expectedConclusion: z.string().optional(),
  }),
  ConflictPlayground: z.object({}),
  ConflictVisualizer: z.object({
    categories: z.array(CategorieTri).min(1),
    items: z.array(ItemTrie).min(1),
  }),
  ConflictResolver: z.object({}),
  ResolutionGuide: z.object({}),
  PushPullAnimator: z.object({}),
  // ⚠️ Lot 2 : rendu par le composant spécialisé « Fork vs Clone » (onglets), sans donnée
  // structurée configurable. `{}` = aucune donnée attendue (l'ancienne forme `CompareContrast`
  // décrivait la configuration morte).
  ForkVsCloneDemo: z.object({}),
  PRWorkflowSimulator: z.object({}),
  PullRequestCreator: z.object({}),
  GitHubInterfaceSimulator: z.object({ blocks: Textes }),
  IssueTracker: z.object({}),
  ActionsWorkflowBuilder: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowSimulator: z.object({ steps: z.array(Etape).min(1) }),
  WorkflowDesigner: z.object({}),
  FlowDiagramBuilder: z.object({ blocks: Textes }),
  TrunkBasedDevelopmentVisualizer: z.object({}),
  ReflogExplorer: z.object({}),
  TimelineNavigator: z.object({}),
  // ⚠️ `UndoCommandComparison` est enregistré sur `UndoCommandComparisonConfig`, qui transmet
  // `config` à `CompareContrast` : le schéma doit décrire la forme de `CompareContrast`
  // (et non un `{ criteria: string[] }` que `CompareContrast` interpréterait comme des critères
  // structurés — donc inutilisable).
  UndoCommandComparison: z.object({
    optionA: OptionComparaison,
    optionB: OptionComparaison,
    criteria: z.array(CritereComparaison).min(1),
    expectedConclusion: z.string().optional(),
  }),
  CommitMessageLinter: z.object({}),
  GitignoreTester: z.object({}),
  AliasCreator: z.object({}),
  SecurityScanner: z.object({}),
  CollaborationSimulator: z.object({}),
  OpenSourceSimulator: z.object({ steps: z.array(Etape).min(1) }),
  AiHelper: z.object({}),

  // --- Composants visuels (illustratifs, sans obligation de niveau Bloom) ---
  // ⚠️ Réalignés sur ce que chaque composant consomme RÉELLEMENT. Les illustrations
  // n'ont aucune donnée structurée (pas de props de données) : `{}`. Les deux graphiques
  // lisent `config.data.entries`.
  GitGraph: z.object({}),
  BranchDiagram: z.object({}),
  CommitTimeline: z.object({}),
  AnimatedFlow: z.object({}),
  ConceptDiagram: z.object({}),
  ConceptExplanation: z.object({}),
  DiffViewer: z.object({}),
  FileTreeViewer: z.object({}),
  RepoComparison: z.object({}),
  WorkflowComparisonTable: z.object({}),
  LanguagesChart: z.object({
    entries: z
      .array(z.object({ name: z.string().min(1), value: z.number(), fill: z.string().min(1) }))
      .min(1),
  }),
  StatisticsChart: z.object({
    entries: z.array(z.object({ name: z.string().min(1), commits: z.number() })).min(1),
  }),
  ProjectDashboard: z.object({}),
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
  GitRepositoryPlayground: { title: 'Bac à Sable de Dépôt Git', description: 'Visualisez et interagissez avec un système de fichiers de dépôt simulé.' },
  GitTimeTravel: { title: 'Machine à Remonter le Temps Git', description: "Naviguez dans l'historique des commits pour voir l'état du projet à différents moments." },
  GitDoctorTool: { title: 'Diagnostic de dépôt', description: 'Répare un état anormal.' },
  StagingAreaVisualizer: { title: 'Zone de staging', description: 'Suis l’état des fichiers.' },
  VersioningDemo: { title: 'Démonstration du Versioning', description: 'Découvrez comment Git sauvegarde les versions de vos fichiers dans le temps.', historyHeading: 'Historique des versions', commitHeading: 'Effectuer un nouveau commit', commitButton: 'Commit les changements' },
  BranchCreator: { title: 'Simulateur de Création de Branches', description: 'Créez et gérez des branches pour simuler un flux de travail de développement.' },
  MergeSimulator: { title: 'Fusion de branches', description: 'Combine le travail.' },
  ConflictPlayground: { title: 'Terrain de Jeu pour Conflits', description: 'Modifiez le texte ci-dessous pour résoudre le conflit manuellement.' },
  ConflictVisualizer: { title: 'Visualise le conflit', description: 'Comprends l’origine.' },
  ConflictResolver: { title: 'Résolveur de Conflits Interactif', description: 'Apprenez à identifier et à résoudre les conflits de fusion en choisissant quelle version conserver.' },
  ResolutionGuide: { title: 'Guide Pas-à-Pas de Résolution de Conflits', description: 'Suivez ces étapes pour résoudre un conflit de fusion comme un pro.' },
  PushPullAnimator: { title: 'Animateur Push & Pull', localHeading: 'Dépôt Local', remoteHeading: 'Dépôt Distant (origin)' },
  ForkVsCloneDemo: { title: 'Démonstration Fork vs Clone', description: "Visualisez les deux flux de travail principaux pour obtenir une copie d'un projet." },
  PRWorkflowSimulator: { title: 'Simulateur de Workflow de Pull Request', description: "Suivez le cycle de vie d'une Pull Request, de la création à la fusion." },
  PullRequestCreator: { title: 'Créateur de Pull Request', description: "Simulez la création d'une Pull Request pour proposer des modifications." },
  GitHubInterfaceSimulator: { title: 'Interface de GitHub', description: 'Repère les éléments.' },
  IssueTracker: { createIssue: 'New Issue' },
  ActionsWorkflowBuilder: { title: 'GitHub Actions', description: 'Automatise ton flux.' },
  WorkflowSimulator: { title: 'Simulateur de workflow', description: 'Exécute le flux.' },
  WorkflowDesigner: { title: 'Designer de Workflow Git', description: 'Concevez et visualisez différents workflows Git comme GitFlow.' },
  FlowDiagramBuilder: { title: 'Construis le diagramme', description: 'Représente le flux.' },
  TrunkBasedDevelopmentVisualizer: { title: 'Visualisation du Trunk-Based Development', description: 'Dans ce flux, tous les développeurs travaillent directement sur une seule branche : le "trunk" (souvent `main`).' },
  ReflogExplorer: { title: 'Explorateur Reflog', description: 'Le `reflog` est le filet de sécurité de Git. Il enregistre tous les mouvements de `HEAD`.' },
  TimelineNavigator: { title: 'Navigateur de Timeline', description: "Naviguez dans l'historique des commits pour voir l'état du projet à différents moments." },
  UndoCommandComparison: { title: 'Annuler : quelle commande ?', description: 'Choisis la bonne annulation.' },
  CommitMessageLinter: { title: 'Linter de Messages de Commit', description: 'Écrivez de meilleurs messages de commit en suivant les bonnes pratiques.' },
  GitignoreTester: { title: 'Simulateur de `.gitignore`', description: 'Testez vos règles `.gitignore` pour voir si un chemin de fichier serait ignoré. Le résultat se met à jour automatiquement.' },
  AliasCreator: { title: "Assistant de Création d'Alias Git", description: 'Créez des raccourcis pour vos commandes Git les plus utilisées.' },
  SecurityScanner: { title: 'Démonstration des Bonnes Pratiques de Sécurité', description: 'Lancez une analyse simulée pour détecter des secrets ou des clés API commités par erreur.' },
  CollaborationSimulator: { title: 'Simulateur de Collaboration', description: 'Simulez un flux de travail collaboratif avec plusieurs contributeurs.' },
  OpenSourceSimulator: { title: 'Contribuer à l’open source', description: 'Suis le processus complet.' },
  // ⚠️ `AiHelper` interpole le sujet du cours dans sa description : elle n'est donc PAS un libellé
  // statique personnalisable. Seuls le titre et le libellé du bouton le sont.
  AiHelper: { title: 'Playground IA Katalyst', askButton: "Demander à l'IA" },

  // --- Composants visuels (illustratifs) ---
  // ⚠️ Réalignés sur le texte RÉELLEMENT affiché : modifier ce libellé par configuration
  // doit produire exactement la valeur par défaut. Les composants qui n'affichent pas de
  // description n'en déclarent donc pas.
  GitGraph: { title: 'Illustration du Flux Git' },
  BranchDiagram: { title: 'Diagramme des Branches' },
  CommitTimeline: { title: 'Frise Chronologique des Commits' },
  AnimatedFlow: { title: 'Flux Animé (ex: Push)' },
  ConceptDiagram: { title: 'Diagramme de Concept' },
  ConceptExplanation: { title: 'Pourquoi le Versioning est Important ?' },
  DiffViewer: { title: 'Visualiseur de Différences' },
  FileTreeViewer: { title: 'Explorateur de Fichiers', description: 'Visualisez la structure de votre projet.' },
  RepoComparison: { title: 'Comparaison Local vs Distant' },
  WorkflowComparisonTable: { title: 'Tableau Comparatif des Workflows Git', description: 'Comparez les approches populaires de gestion de branches pour choisir celle qui convient à votre projet.' },
  LanguagesChart: { title: 'Répartition des langages' },
  StatisticsChart: { title: 'Statistiques' },
  ProjectDashboard: { title: 'Tableau de Bord du Projet Final', description: 'Un résumé de vos accomplissements durant le projet final simulé.' },
};

/**
 * Catalogue des composants pédagogiques — **métadonnées uniquement**.
 *
 * Ce module ne contient AUCUN import React : il est donc utilisable partout
 * (schémas, actions serveur, prompts IA, tests) sans tirer les 46 composants —
 * ni leurs dépendances lourdes (Genkit, etc.) — dans le bundle ou dans un test.
 *
 * Le lien vers les composants React vit dans `./index.ts`.
 */

export type ComponentKind = 'interactive' | 'visual';

/**
 * État de maturité du composant.
 * - `functional`  : l'interaction annoncée fonctionne réellement ;
 * - `placeholder` : l'interface existe (titre, contrôles apparents) mais aucune
 *   interaction n'est implémentée — un bouton sans handler, par exemple.
 *
 * Constaté le 2026-09-21 : 13 composants classés « interactifs » sont des
 * placeholders. Ils ne doivent pas être proposés par l'IA comme mise en pratique.
 */
export type ComponentStatus = 'functional' | 'placeholder';

export interface ComponentMeta {
  /** Nom technique, tel qu'utilisé dans `interactiveComponentName` / `visualComponentName`. */
  name: string;
  kind: ComponentKind;
  status: ComponentStatus;
  /** Décrit ce que le composant apporte — injecté dans le prompt IA. */
  description: string;
}

/**
 * Composants dont l'interface existe mais dont l'interaction n'est pas implémentée.
 *
 * Constat : ces fichiers ne contiennent aucun gestionnaire d'événement ni état
 * (vérifié par recherche de `useState`/`onClick`/`onChange`/`onDrag`). Ils
 * affichent des contrôles inertes — un `<Button>` sans `onClick`, par exemple.
 *
 * Conséquence : ils ne doivent PAS être proposés comme « mise en pratique ».
 * Les rendre réellement interactifs relève de la phase 6 (conformité du contenu).
 */
export const PLACEHOLDER_COMPONENTS = new Set<string>([
  'CollaborationSimulator',
  'ConflictVisualizer',
  'ForkVsCloneDemo',
  'GitCommandSimulator',
  'GitDoctorTool',
  'GitRepositoryPlayground',
  'GitTimeTravel',
  'PullRequestCreator',
  'ReflogExplorer',
  'ResolutionGuide',
  'TrunkBasedDevelopmentVisualizer',
  'UndoCommandComparison',
  'WorkflowDesigner',
]);

/** Descriptions des composants interactifs (l'apprenant manipule). */
export const INTERACTIVE_DESCRIPTIONS: Record<string, string> = {
  GitRepositoryPlayground: "Bac à sable Git complet : l'apprenant exécute de vraies commandes et observe l'état du dépôt.",
  GitCommandSimulator: "Simulateur de commandes Git : saisie d'une commande, résultat et explication pas à pas.",
  GitTimeTravel: "Voyage dans l'historique : revenir à un commit, explorer les états successifs du dépôt.",
  GitDoctorTool: "Diagnostic de dépôt : détecter et corriger un état Git problématique (detached HEAD, conflit).",
  StagingAreaVisualizer: "Zone de staging manipulable : ajouter, retirer et committer des fichiers pour comprendre l'index.",
  VersioningDemo: "Démonstration du versioning : créer des versions successives d'un fichier et comparer.",
  BranchCreator: "Création et bascule de branches : manipuler les références de branche et observer HEAD.",
  MergeSimulator: "Simulateur de fusion : choisir une stratégie (fast-forward, merge commit) et voir le résultat.",
  ConflictPlayground: "Bac à sable de conflit : provoquer, résoudre et valider un conflit de fusion.",
  ConflictVisualizer: "Visualisation interactive d'un conflit : identifier les versions en présence et leur origine.",
  ConflictResolver: "Résolution guidée de conflit : choisir les hunks à conserver et produire la version finale.",
  ResolutionGuide: "Guide interactif de résolution : étapes ordonnées pour sortir d'un conflit.",
  PushPullAnimator: "Animation manipulable des échanges distants : pousser, tirer et observer la divergence.",
  ForkVsCloneDemo: "Comparateur interactif fork / clone : montrer la différence de lien avec le dépôt d'origine.",
  PRWorkflowSimulator: "Simulateur de Pull Request : ouvrir, commenter, approuver et fusionner une PR.",
  PullRequestCreator: "Création de Pull Request : rédiger titre, description, reviewers et cible de branche.",
  GitHubInterfaceSimulator: "Reproduction de l'interface GitHub : s'orienter dans les onglets, issues et dépôts.",
  IssueTracker: "Gestionnaire de tickets : créer, prioriser, assigner et faire évoluer des issues.",
  ActionsWorkflowBuilder: "Constructeur de workflow GitHub Actions : assembler déclencheurs, jobs et étapes.",
  WorkflowSimulator: "Simulateur de workflow collaboratif : appliquer un modèle (GitFlow, GitHub Flow) étape par étape.",
  WorkflowDesigner: "Concepteur de workflow : dessiner un flux de branches et vérifier sa cohérence.",
  FlowDiagramBuilder: "Constructeur de diagramme de flux : placer et relier des étapes de processus.",
  TrunkBasedDevelopmentVisualizer: "Visualisation interactive du trunk-based development : comparer avec GitFlow sur un même scénario.",
  ReflogExplorer: "Explorateur de reflog : retrouver un commit perdu et le restaurer.",
  TimelineNavigator: "Navigation temporelle dans l'historique : se déplacer entre les commits et inspecter chaque état.",
  UndoCommandComparison: "Comparateur de commandes d'annulation : choisir la bonne (revert, reset, restore) selon le cas.",
  CommitMessageLinter: "Vérificateur de message de commit : saisir un message et obtenir les règles de convention respectées ou non.",
  GitignoreTester: "Testeur de .gitignore : saisir des motifs et vérifier quels fichiers seraient ignorés.",
  AliasCreator: "Créateur d'alias Git : définir un raccourci et voir la commande développée.",
  SecurityScanner: "Scanner de sécurité : détecter un secret commité et comprendre la remédiation.",
  CollaborationSimulator: "Simulateur de collaboration : plusieurs contributeurs agissent sur le même dépôt et l'apprenant arbitre.",
  OpenSourceSimulator: "Simulateur de contribution open source : fork, branche, PR et revue sur un projet public.",
  AiHelper: "Assistant IA contextuel : poser une question sur l'état courant de l'exercice.",
};

/** Descriptions des composants visuels (l'apprenant observe). */
export const VISUAL_DESCRIPTIONS: Record<string, string> = {
  GitGraph: "Graphe de commits : branches, fusions et historique rendus sous forme de graphe.",
  BranchDiagram: "Diagramme de branche : représentation statique de la divergence et de la convergence.",
  CommitTimeline: "Chronologie des commits : succession ordonnée avec dates et auteurs.",
  AnimatedFlow: "Flux animé : circulation d'une donnée ou d'une commande entre les étapes du système.",
  ConceptDiagram: "Diagramme de concept : schéma explicatif d'une notion abstraite.",
  ConceptExplanation: "Encadré d'explication : définition, analogie et point clé d'un concept.",
  DiffViewer: "Vue de diff : comparaison ligne à ligne de deux versions.",
  FileTreeViewer: "Arbre de fichiers : structure d'un projet à explorer visuellement.",
  RepoComparison: "Comparaison de dépôts : mettre deux projets ou deux états côte à côte.",
  WorkflowComparisonTable: "Tableau comparatif de workflows : forces, faiblesses et cas d'usage de chaque modèle.",
  LanguagesChart: "Répartition des langages : graphique de composition d'un dépôt.",
  StatisticsChart: "Statistiques de dépôt : indicateurs d'activité présentés graphiquement.",
  ProjectDashboard: "Tableau de bord de projet : vue synthétique de l'avancement (issues, PR, jalons).",
};

function toMeta(
  descriptions: Record<string, string>,
  kind: ComponentKind,
): ComponentMeta[] {
  return Object.entries(descriptions).map(([name, description]) => ({
    name,
    kind,
    status: PLACEHOLDER_COMPONENTS.has(name) ? 'placeholder' : 'functional',
    description,
  }));
}

/** Catalogue complet, métadonnées seules. */
export const COMPONENT_CATALOG: ComponentMeta[] = [
  ...toMeta(INTERACTIVE_DESCRIPTIONS, 'interactive'),
  ...toMeta(VISUAL_DESCRIPTIONS, 'visual'),
];

/** Catalogue indexé par nom. */
export const COMPONENT_CATALOG_BY_NAME: Record<string, ComponentMeta> = Object.fromEntries(
  COMPONENT_CATALOG.map((meta) => [meta.name, meta]),
);

/** Nombre total de composants disponibles. */
export const CATALOG_SIZE = COMPONENT_CATALOG.length;

/** Métadonnées d'une nature donnée. */
export function listByKind(kind: ComponentKind): ComponentMeta[] {
  return COMPONENT_CATALOG.filter((meta) => meta.kind === kind);
}

/** Noms des composants d'une nature donnée (pour les prompts IA). */
export function listNames(kind: ComponentKind): string[] {
  return listByKind(kind).map((meta) => meta.name);
}

/** Métadonnées correspondantes, ou `undefined` si le nom est inconnu. */
export function resolveComponentMeta(name: string): ComponentMeta | undefined {
  return COMPONENT_CATALOG_BY_NAME[name];
}

/** Composants interactifs réellement opérationnels (placeholders exclus). */
export function listFunctionalInteractiveNames(): string[] {
  return listByKind('interactive')
    .filter((meta) => meta.status === 'functional')
    .map((meta) => meta.name);
}

/**
 * Retourne les métadonnées attendues, ou lève une erreur explicite.
 *
 * Vérifie l'existence ET la nature : un composant visuel placé dans
 * `interactiveComponentName` (ou l'inverse) est refusé.
 */
export function assertKnownComponent(name: string, kind: ComponentKind): ComponentMeta {
  const meta = resolveComponentMeta(name);

  if (!meta) {
    throw new Error(
      `Composant inconnu : "${name}". Voir src/components/registry/catalog.ts (composants disponibles).`,
    );
  }

  if (meta.kind !== kind) {
    throw new Error(
      `Composant "${name}" est de nature "${meta.kind}", attendu "${kind}". ` +
        `Un composant visuel ne remplit pas une mise en pratique, et inversement.`,
    );
  }

  return meta;
}

/**
 * Vérifie qu'un nom est connu, qu'il est de la bonne nature, et qu'il est
 * réellement opérationnel. À utiliser à la **création** (outil de création, IA) :
 * on refuse ainsi de générer une leçon pointant vers une coquille statique.
 */
export function assertUsableComponent(name: string, kind: ComponentKind): ComponentMeta {
  const meta = assertKnownComponent(name, kind);

  if (meta.status === 'placeholder') {
    throw new Error(
      `Composant "${name}" est un placeholder (interface sans interaction réelle) : ` +
        `il ne peut pas servir de mise en pratique. Voir PLACEHOLDER_COMPONENTS.`,
    );
  }

  return meta;
}

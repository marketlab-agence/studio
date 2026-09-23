/**
 * Catalogue des composants pédagogiques — **métadonnées uniquement**.
 *
 * Ce module ne contient AUCUN import React : il est donc utilisable partout
 * (schémas, actions serveur, prompts IA, tests) sans tirer les 46 composants —
 * ni leurs dépendances lourdes (Genkit, etc.) — dans le bundle ou dans un test.
 *
 * Le lien vers les composants React vit dans `./index.ts`.
 */

import type { BloomLevel } from '@/lib/content/bloom';

export type ComponentKind = 'interactive' | 'visual';

/**
 * Domaine de contenu auquel un composant s'applique.
 *
 * ⚠️ **Pourquoi ce champ existe.** Sans lui, `generateLessonContentAction` transmettait le
 * **catalogue entier** à l'IA : sur une formation de vente, elle se voyait proposer
 * `MergeSimulator`. Elle ne le choisissait probablement pas, mais rien ne l'en empêchait
 * structurellement.
 *
 * `'*'` désigne un composant **générique**, pertinent pour toute formation (quiz, tri,
 * appariement…). C'est la valeur par défaut des primitives réutilisables.
 */
export type ComponentDomain =
  | '*'
  | 'git'
  | 'ia'
  | 'automatisation'
  | 'gestion-projet'
  | 'marketing'
  | 'vente';

/** Tous les domaines connus, pour validation et affichage. */
export const COMPONENT_DOMAINS: readonly ComponentDomain[] = [
  '*',
  'git',
  'ia',
  'automatisation',
  'gestion-projet',
  'marketing',
  'vente',
];

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
  /**
   * Domaines où le composant est pertinent. `['*']` = générique.
   * Sert à **filtrer** ce que l'IA reçoit (voir `listForDomain`).
   */
  domains: readonly ComponentDomain[];
  /**
   * Niveaux de Bloom que le composant permet de travailler.
   *
   * ⚠️ Un composant **sans niveau** ne peut pas être mis en correspondance avec un objectif
   * pédagogique — la règle R6 de `@docs/katalyst/regles-conformite.md` le refuserait. Un
   * tableau vide est donc un défaut, pas une option.
   */
  bloomLevels: readonly BloomLevel[];
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
  // ⚠️ `GitCommandSimulator` a été RETIRÉ de cette liste le 2026-09-23 : il a été réécrit
  // comme **configuration de `StepByStepRunner`** (étape 14 du plan de phase 6). Il produit
  // désormais une trace d'interaction par étape validée, donc l'indicateur 19 est satisfait.
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
  /**
   * ⚠️ **Primitive générique** (étape 14 du plan de phase 6) — et non composant de domaine.
   *
   * Elle exécute une **procédure** fournie en données : elle ne sait rien de Git, de n8n ou
   * du closing. C'est ce qui la rend réutilisable ailleurs — `GitCommandSimulator` en est une
   * configuration. Voir `@docs/katalyst/primitives-pedagogiques.md`.
   */
  StepByStepRunner:
    'Exécution guidée d’une procédure : l’apprenant valide chaque étape dans l’ordre, reçoit un indice en cas d’erreur et une explication après réussite. Chaque étape produit une trace de suivi.',
  GitCommandSimulator:
    "Procédure Git guidée : l'apprenant exécute les commandes essentielles (clone, status, add, commit, push) ; chaque étape est validée et expliquée.",
  GitRepositoryPlayground: "Bac à sable Git complet : l'apprenant exécute de vraies commandes et observe l'état du dépôt.",
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

/**
 * Domaines par composant.
 *
 * ⚠️ **Constat mesuré le 2026-09-23** : les 33 composants interactifs et 13 visuels
 * proviennent **tous** de la formation `git-github`. Aucun ne concerne la vente, le
 * marketing, l'IA ou la gestion de projet. Ce champ rend cet état **visible** au lieu de le
 * laisser implicite — et il permet à l'IA de ne pas se voir proposer `MergeSimulator` sur
 * une formation de closing.
 *
 * Les 13 placeholders sont marqués `git` (leur domaine d'origine). Les composants des autres
 * formations **n'existent pas encore** : c'est le travail des étapes 15 et 16.
 */
const COMPONENT_DOMAINS_BY_NAME: Record<string, readonly ComponentDomain[]> = {
  // --- Interactifs Git (y compris les placeholders) -------------------------
  StepByStepRunner: ['*'], // PRIMITIVE générique : procédure guidée, applicable partout
  GitRepositoryPlayground: ['git'],
  GitCommandSimulator: ['git'],
  GitTimeTravel: ['git'],
  GitDoctorTool: ['git'],
  ReflogExplorer: ['git'],
  StagingAreaVisualizer: ['git'],
  VersioningDemo: ['*'], // versionner existe dans tout projet : générique
  BranchCreator: ['git'],
  ConflictPlayground: ['git'],
  ConflictVisualizer: ['git'],
  MergeSimulator: ['git'],
  ResolutionGuide: ['git'],
  UndoCommandComparison: ['git'],
  ForkVsCloneDemo: ['git'],
  PullRequestCreator: ['git', 'gestion-projet'],
  CollaborationSimulator: ['git', 'gestion-projet'],
  WorkflowDesigner: ['git', 'gestion-projet'],
  TrunkBasedDevelopmentVisualizer: ['git'],

  // --- Visuels Git ---------------------------------------------------------
  GitGraph: ['git'],
  BranchDiagram: ['git'],
  CommitTimeline: ['git'],
  DiffViewer: ['git'],
  RepoComparison: ['git'],
  LanguagesChart: ['git'],
  StatisticsChart: ['*'], // des statistiques existent partout
  ProjectDashboard: ['gestion-projet'],

  // --- Visuels génériques --------------------------------------------------
  AnimatedFlow: ['*'],
  ConceptDiagram: ['*'],
  ConceptExplanation: ['*'],
  FileTreeViewer: ['*'],
  WorkflowComparisonTable: ['*'],
};

/**
 * Niveaux de Bloom par composant.
 *
 * ⚠️ Ces correspondances sont **déduites de la nature du composant**, pas inventées : un
 * simulateur de commandes fait *appliquer*, un comparateur fait *analyser*, un concepteur
 * fait *créer*. Elles seront affinées à l'étape 11 (table à 3 contraintes).
 */
const COMPONENT_BLOOM_BY_NAME: Record<string, readonly BloomLevel[]> = {
  // --- Interactifs ---------------------------------------------------------
  StepByStepRunner: ['Appliquer'], // PRIMITIVE : exécution guidée
  GitRepositoryPlayground: ['Appliquer', 'Créer'],
  GitCommandSimulator: ['Appliquer'],
  GitTimeTravel: ['Comprendre', 'Analyser'],
  GitDoctorTool: ['Analyser', 'Évaluer'],
  ReflogExplorer: ['Analyser'],
  StagingAreaVisualizer: ['Comprendre', 'Appliquer'],
  VersioningDemo: ['Comprendre', 'Appliquer'],
  BranchCreator: ['Appliquer'],
  ConflictPlayground: ['Appliquer', 'Analyser'],
  ConflictVisualizer: ['Comprendre', 'Analyser'],
  MergeSimulator: ['Appliquer', 'Évaluer'],
  ResolutionGuide: ['Analyser', 'Évaluer'],
  UndoCommandComparison: ['Analyser', 'Évaluer'],
  ForkVsCloneDemo: ['Comprendre'],
  PullRequestCreator: ['Appliquer', 'Créer'],
  CollaborationSimulator: ['Analyser', 'Évaluer'],
  WorkflowDesigner: ['Créer'],
  TrunkBasedDevelopmentVisualizer: ['Comprendre', 'Analyser'],

  // --- Visuels -------------------------------------------------------------
  GitGraph: ['Connaître', 'Comprendre'],
  BranchDiagram: ['Connaître', 'Comprendre'],
  CommitTimeline: ['Connaître', 'Comprendre'],
  DiffViewer: ['Comprendre', 'Analyser'],
  RepoComparison: ['Analyser'],
  LanguagesChart: ['Connaître'],
  StatisticsChart: ['Connaître', 'Analyser'],
  ProjectDashboard: ['Analyser'],
  AnimatedFlow: ['Comprendre'],
  ConceptDiagram: ['Connaître', 'Comprendre'],
  ConceptExplanation: ['Connaître', 'Comprendre'],
  FileTreeViewer: ['Connaître', 'Comprendre'],
  WorkflowComparisonTable: ['Analyser', 'Évaluer'],
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
    // Un composant sans domaine déclaré est traité comme **générique** : c'est le défaut le
    // plus sûr (il reste proposé partout) — l'inverse masquerait des composants utiles.
    domains: COMPONENT_DOMAINS_BY_NAME[name] ?? ['*'],
    bloomLevels: COMPONENT_BLOOM_BY_NAME[name] ?? [],
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

// --- Filtrage par domaine et par niveau ---------------------------------------

/**
 * Composants pertinents pour une formation d'un domaine donné.
 *
 * ⚠️ **Correction d'un risque réel.** Avant ce filtrage, `generateLessonContentAction`
 * transmettait le catalogue **entier** à l'IA : sur une formation de vente, elle recevait
 * `MergeSimulator`, `StashWorkflowSimulator`… sans rapport. Elle ne les choisissait
 * probablement pas, mais rien ne l'en empêchait.
 *
 * Un composant générique (`domains: ['*']`) est **toujours** inclus.
 *
 * @param domain Domaine de la formation, ou `undefined` pour tout recevoir (comportement
 *   historique, conservé pour ne pas casser les appelants qui ne connaissent pas le domaine).
 */
export function listByDomain(
  kind: ComponentKind,
  domain: ComponentDomain | undefined,
): ComponentMeta[] {
  const components = listByKind(kind);

  // Domaine inconnu : on ne filtre pas. Mieux vaut proposer trop que de priver l'IA de tout
  // composant faute d'information sur la formation.
  if (!domain) return components;

  return components.filter(
    (meta) => meta.domains.includes('*') || meta.domains.includes(domain),
  );
}

/** Noms des composants pertinents pour un domaine (pour les prompts IA). */
export function listNamesForDomain(
  kind: ComponentKind,
  domain: ComponentDomain | undefined,
): string[] {
  return listByDomain(kind, domain).map((meta) => meta.name);
}

/**
 * Noms des composants **interactifs fonctionnels** pertinents pour un domaine.
 * C'est cette liste qui doit être transmise à l'IA (placeholders exclus + domaine filtré).
 */
export function listFunctionalInteractiveNamesForDomain(
  domain: ComponentDomain | undefined,
): string[] {
  return listByDomain('interactive', domain)
    .filter((meta) => meta.status === 'functional')
    .map((meta) => meta.name);
}

/**
 * Composants capables de travailler un niveau de Bloom donné.
 *
 * Sert à l'IA pour choisir un composant **cohérent avec l'objectif** de la leçon, et au
 * contrôle de la règle R6.
 */
export function listByBloomLevel(
  kind: ComponentKind,
  level: BloomLevel,
  domain?: ComponentDomain,
): ComponentMeta[] {
  return listByDomain(kind, domain).filter((meta) => meta.bloomLevels.includes(level));
}

/** Composants sans niveau de Bloom déclaré — défaut à corriger, pas une option. */
export function listWithoutBloomLevels(kind?: ComponentKind): ComponentMeta[] {
  const components = kind ? listByKind(kind) : COMPONENT_CATALOG;
  return components.filter((meta) => meta.bloomLevels.length === 0);
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

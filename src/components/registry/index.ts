import type { ComponentType } from 'react';
import { COMPONENT_CATALOG, type ComponentMeta } from './catalog';

// --- Composants interactifs --------------------------------------------------
// ⚠️ Les configurations Git remplacent les placeholders (étape 16) : elles reposent sur les
// primitives génériques et produisent une trace. Voir git-configurations.tsx.
import {
  GitDoctorTool as GitDoctorToolConfig,
  MergeStrategyComparison,
  UndoCommandComparison as UndoCommandComparisonConfig,
  ConflictVisualizer as ConflictVisualizerConfig,
  StagingAreaVisualizer as StagingAreaVisualizerConfig,
} from '@/components/interactive/git-configurations';
import { AiHelper } from '@/components/interactive/AiHelper';
import { BuilderCanvas } from '@/components/interactive/primitives/BuilderCanvas';
import { CaseDiagnosis } from '@/components/interactive/primitives/CaseDiagnosis';
import { CompareContrast } from '@/components/interactive/primitives/CompareContrast';
import { DecisionScenario } from '@/components/interactive/primitives/DecisionScenario';
import { DraftCoach } from '@/components/interactive/primitives/DraftCoach';
import { FlashcardDrill } from '@/components/interactive/primitives/FlashcardDrill';
import { GuidedProcedure } from '@/components/interactive/primitives/GuidedProcedure';
import { MatchingPairs } from '@/components/interactive/primitives/MatchingPairs';
import { PeerReviewSimulator } from '@/components/interactive/primitives/PeerReviewSimulator';
import { RecallQuiz } from '@/components/interactive/primitives/RecallQuiz';
import { SortingGame } from '@/components/interactive/primitives/SortingGame';
import { StepByStepRunner } from '@/components/interactive/primitives/StepByStepRunner';
import { BranchCreator } from '@/components/interactive/BranchCreator';
import { CollaborationSimulator } from '@/components/interactive/CollaborationSimulator';
import { ConflictResolver } from '@/components/interactive/ConflictResolver';
import { GitCommandSimulator } from '@/components/interactive/GitCommandSimulator';
import { GitDoctorTool } from '@/components/interactive/GitDoctorTool';
import { GitRepositoryPlayground } from '@/components/interactive/GitRepositoryPlayground';
import { GitTimeTravel } from '@/components/interactive/GitTimeTravel';
import { MergeSimulator } from '@/components/interactive/MergeSimulator';
import { PullRequestCreator } from '@/components/interactive/PullRequestCreator';
import { WorkflowDesigner } from '@/components/interactive/WorkflowDesigner';
import { ActionsWorkflowBuilder } from '@/components/specialized/part-9/ActionsWorkflowBuilder';
import { AliasCreator } from '@/components/specialized/part-11/AliasCreator';
import { CommitMessageLinter } from '@/components/specialized/part-11/CommitMessageLinter';
import { ConflictPlayground } from '@/components/specialized/part-7/ConflictPlayground';
import { ConflictVisualizer } from '@/components/specialized/part-7/ConflictVisualizer';
import { FlowDiagramBuilder } from '@/components/specialized/part-6/FlowDiagramBuilder';
import { ForkVsCloneDemo } from '@/components/specialized/part-5/ForkVsCloneDemo';
import { GitHubInterfaceSimulator } from '@/components/specialized/part-9/GitHubInterfaceSimulator';
import { GitignoreTester } from '@/components/specialized/part-11/GitignoreTester';
import { IssueTracker } from '@/components/specialized/part-9/IssueTracker';
import { OpenSourceSimulator } from '@/components/specialized/part-10/OpenSourceSimulator';
import { PRWorkflowSimulator } from '@/components/specialized/part-5/PRWorkflowSimulator';
import { PushPullAnimator } from '@/components/specialized/part-4/PushPullAnimator';
import { ReflogExplorer } from '@/components/specialized/part-8/ReflogExplorer';
import { ResolutionGuide } from '@/components/specialized/part-7/ResolutionGuide';
import { SecurityScanner } from '@/components/specialized/part-11/SecurityScanner';
import { StagingAreaVisualizer } from '@/components/specialized/part-2/StagingAreaVisualizer';
import { TimelineNavigator } from '@/components/specialized/part-8/TimelineNavigator';
import { TrunkBasedDevelopmentVisualizer } from '@/components/specialized/part-6/TrunkBasedDevelopmentVisualizer';
import { UndoCommandComparison } from '@/components/specialized/part-8/UndoCommandComparison';
import { VersioningDemo } from '@/components/specialized/part-1/VersioningDemo';
import { WorkflowSimulator } from '@/components/specialized/part-6/WorkflowSimulator';

// --- Composants visuels ------------------------------------------------------
import { ConceptExplanation } from '@/components/tutorial/ConceptExplanation';
import { FileTreeViewer } from '@/components/file-explorer';
import { ProjectDashboard } from '@/components/specialized/part-10/ProjectDashboard';
import { WorkflowComparisonTable } from '@/components/specialized/part-6/WorkflowComparisonTable';
import { AnimatedFlow } from '@/components/visualizations/AnimatedFlow';
import { BranchDiagram } from '@/components/visualizations/BranchDiagram';
import { CommitTimeline } from '@/components/visualizations/CommitTimeline';
import { ConceptDiagram } from '@/components/visualizations/ConceptDiagram';
import { DiffViewer } from '@/components/visualizations/DiffViewer';
import { GitGraph } from '@/components/visualizations/GitGraph';
import { LanguagesChart } from '@/components/visualizations/LanguagesChart';
import { RepoComparison } from '@/components/visualizations/RepoComparison';
import { StatisticsChart } from '@/components/visualizations/StatisticsChart';

/**
 * Registre des composants pédagogiques — **liaison nom → composant React**.
 *
 * ⚠️ Importer ce module tire les 46 composants (et leurs dépendances, dont
 * Genkit via `AiHelper`). À réserver au **rendu** (`LessonView`).
 * Pour les métadonnées (IA, validation, tests), utiliser `./catalog`, qui
 * n'importe aucun composant.
 */

export interface RegistryEntry extends ComponentMeta {
  component: ComponentType<Record<string, unknown>>;
}

// Les composants ont des signatures de props hétérogènes (héritage) : `any` est
// assumé ici, la validation porte sur les métadonnées, pas sur les props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENTS: Record<string, ComponentType<any>> = {
  // interactifs
  AiHelper, BranchCreator, CollaborationSimulator, ConflictResolver,
  GitCommandSimulator,
  StepByStepRunner, RecallQuiz, FlashcardDrill, SortingGame, MatchingPairs, GuidedProcedure,
  CaseDiagnosis, CompareContrast, DecisionScenario, PeerReviewSimulator,
  BuilderCanvas, DraftCoach,
  GitDoctorTool: GitDoctorToolConfig, GitRepositoryPlayground, GitTimeTravel,
  MergeSimulator: MergeStrategyComparison, PullRequestCreator, WorkflowDesigner,
  ActionsWorkflowBuilder, AliasCreator, CommitMessageLinter, ConflictPlayground,
  ConflictVisualizer: ConflictVisualizerConfig, FlowDiagramBuilder, ForkVsCloneDemo, GitHubInterfaceSimulator,
  GitignoreTester, IssueTracker, OpenSourceSimulator, PRWorkflowSimulator,
  PushPullAnimator, ReflogExplorer, ResolutionGuide, SecurityScanner,
  StagingAreaVisualizer: StagingAreaVisualizerConfig, TimelineNavigator, TrunkBasedDevelopmentVisualizer,
  UndoCommandComparison: UndoCommandComparisonConfig, VersioningDemo, WorkflowSimulator,
  // visuels
  ConceptExplanation, FileTreeViewer, ProjectDashboard, WorkflowComparisonTable,
  AnimatedFlow, BranchDiagram, CommitTimeline, ConceptDiagram, DiffViewer,
  GitGraph, LanguagesChart, RepoComparison, StatisticsChart,
};

/** Registre complet, indexé par nom de composant. */
export const REGISTRY: Record<string, RegistryEntry> = Object.fromEntries(
  COMPONENT_CATALOG.map((meta) => [
    meta.name,
    { ...meta, component: COMPONENTS[meta.name] as RegistryEntry['component'] },
  ]),
);

/** Nombre total de composants disponibles. */
export const REGISTRY_SIZE = Object.keys(REGISTRY).length;

/** Entrée complète (métadonnées + composant), ou `undefined` si inconnu. */
export function resolveComponent(name: string): RegistryEntry | undefined {
  return REGISTRY[name];
}

// Ré-export des métadonnées : `@/components/registry` reste un point d'entrée unique.
export * from './catalog';

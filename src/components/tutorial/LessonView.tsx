
import React from 'react';
import { Lesson } from '@/types/tutorial.types';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Lightbulb } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

// Import all possible interactive components
import { StagingAreaVisualizer } from '@/components/specialized/part-2/StagingAreaVisualizer';
import { VersioningDemo } from '@/components/specialized/part-1/VersioningDemo';
import { GitGraph } from '@/components/visualizations/GitGraph';
import { ConceptExplanation } from '@/components/tutorial/ConceptExplanation';
import { BranchCreator } from '@/components/interactive/BranchCreator';
import { MergeSimulator } from '@/components/interactive/MergeSimulator';
import { PushPullAnimator } from '@/components/specialized/part-4/PushPullAnimator';
import { ForkVsCloneDemo } from '@/components/specialized/part-5/ForkVsCloneDemo';
import { PRWorkflowSimulator } from '@/components/specialized/part-5/PRWorkflowSimulator';
import { ConflictVisualizer } from '@/components/specialized/part-7/ConflictVisualizer';
import { ResolutionGuide } from '@/components/specialized/part-7/ResolutionGuide';
import { ConflictPlayground } from '@/components/specialized/part-7/ConflictPlayground';
import { UndoCommandComparison } from '@/components/specialized/part-8/UndoCommandComparison';
import { TimelineNavigator } from '@/components/specialized/part-8/TimelineNavigator';
import { ReflogExplorer } from '@/components/specialized/part-8/ReflogExplorer';
import { GitHubInterfaceSimulator } from '@/components/specialized/part-9/GitHubInterfaceSimulator';
import { IssueTracker } from '@/components/specialized/part-9/IssueTracker';
import { ActionsWorkflowBuilder } from '@/components/specialized/part-9/ActionsWorkflowBuilder';
import { OpenSourceSimulator } from '@/components/specialized/part-10/OpenSourceSimulator';
import { ProjectDashboard } from '@/components/specialized/part-10/ProjectDashboard';
import { WorkflowComparisonTable } from '@/components/specialized/part-6/WorkflowComparisonTable';
import { WorkflowSimulator } from '@/components/specialized/part-6/WorkflowSimulator';
import { CommitMessageLinter } from '@/components/specialized/part-11/CommitMessageLinter';
import { GitignoreTester } from '@/components/specialized/part-11/GitignoreTester';
import { AliasCreator } from '@/components/specialized/part-11/AliasCreator';
import { SecurityScanner } from '@/components/specialized/part-11/SecurityScanner';
import { TrunkBasedDevelopmentVisualizer } from '@/components/specialized/part-6/TrunkBasedDevelopmentVisualizer';
import { AiHelper } from '@/components/interactive/AiHelper';
import { CollaborationSimulator } from '@/components/interactive/CollaborationSimulator';
import { GitCommandSimulator } from '@/components/interactive/GitCommandSimulator';
import { GitDoctorTool } from '@/components/interactive/GitDoctorTool';
import { GitRepositoryPlayground } from '@/components/interactive/GitRepositoryPlayground';
import { GitTimeTravel } from '@/components/interactive/GitTimeTravel';
import { PullRequestCreator } from '@/components/interactive/PullRequestCreator';
import { WorkflowDesigner } from '@/components/interactive/WorkflowDesigner';
import { AnimatedFlow } from '@/components/visualizations/AnimatedFlow';
import { BranchDiagram } from '@/components/visualizations/BranchDiagram';
import { CommitTimeline } from '@/components/visualizations/CommitTimeline';
import { ConceptDiagram } from '@/components/visualizations/ConceptDiagram';
import { DiffViewer } from '@/components/visualizations/DiffViewer';
import { LanguagesChart } from '@/components/visualizations/LanguagesChart';
import { RepoComparison } from '@/components/visualizations/RepoComparison';
import { StatisticsChart } from '@/components/visualizations/StatisticsChart';
import { FileTreeViewer } from '@/components/file-explorer';
import { FlowDiagramBuilder } from '@/components/specialized/part-6/FlowDiagramBuilder';
import { ConflictResolver } from '@/components/interactive/ConflictResolver';

// Create a map from component name strings to actual components
const componentMap: { [key: string]: React.ComponentType<any> } = {
    StagingAreaVisualizer,
    VersioningDemo,
    GitGraph,
    ConceptExplanation,
    BranchCreator,
    MergeSimulator,
    PushPullAnimator,
    ForkVsCloneDemo,
    PRWorkflowSimulator,
    ConflictVisualizer,
    ResolutionGuide,
    ConflictPlayground,
    UndoCommandComparison,
    TimelineNavigator,
    ReflogExplorer,
    GitHubInterfaceSimulator,
    IssueTracker,
    ActionsWorkflowBuilder,
    OpenSourceSimulator,
    ProjectDashboard,
    WorkflowComparisonTable,
    WorkflowSimulator,
    CommitMessageLinter,
    GitignoreTester,
    AliasCreator,
    SecurityScanner,
    TrunkBasedDevelopmentVisualizer,
    AiHelper,
    CollaborationSimulator,
    GitCommandSimulator,
    GitDoctorTool,
    GitRepositoryPlayground,
    GitTimeTravel,
    PullRequestCreator,
    WorkflowDesigner,
    AnimatedFlow,
    BranchDiagram,
    CommitTimeline,
    ConceptDiagram,
    DiffViewer,
    LanguagesChart,
    RepoComparison,
    StatisticsChart,
    FileTreeViewer,
    FlowDiagramBuilder,
    ConflictResolver,
};

type LessonViewProps = {
    lesson: Lesson;
};

export function LessonView({ lesson }: LessonViewProps) {
    const { course } = useTutorial();
    const InteractiveComponent = lesson.interactiveComponentName ? componentMap[lesson.interactiveComponentName] : null;
    const VisualComponent = lesson.visualComponentName ? componentMap[lesson.visualComponentName] : null;

    const componentProps = {
        lessonContext: lesson.title,
        courseTopic: course?.title || 'le sujet actuel',
    };

    return (
        <div>
            <div className="mb-8">
                <p className="text-sm font-semibold text-primary">Leçon {lesson.id}</p>
                <h1 className="text-4xl font-bold tracking-tight mt-1">{lesson.title}</h1>
                <p className="text-lg text-muted-foreground mt-2">{lesson.objective}</p>
            </div>

            <article className="prose dark:prose-invert max-w-none">
                <ReactMarkdown components={{
                    code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                        <CodeBlock className="my-6">
                            {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                        ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                        )
                    },
                    blockquote({children}) {
                        return (
                            <Alert className="bg-muted/50 my-6">
                                <Lightbulb className="h-5 w-5" />
                                <AlertTitle>Bon à savoir</AlertTitle>
                                <AlertDescription>
                                    {children}
                                </AlertDescription>
                            </Alert>
                        )
                    }
                }}>{lesson.content}</ReactMarkdown>
            </article>
            
            {InteractiveComponent && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold tracking-tight mb-4 border-b pb-2">Mise en Pratique</h2>
                    <InteractiveComponent {...componentProps} />
                </div>
            )}

            {VisualComponent && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold tracking-tight mb-4 border-b pb-2">Visualisation</h2>
                    <VisualComponent {...componentProps} />
                </div>
            )}
        </div>
    );
}

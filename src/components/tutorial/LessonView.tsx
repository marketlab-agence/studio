import React from 'react';
import { Lesson } from '@/types/tutorial.types';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Lightbulb } from 'lucide-react';

// Import all possible interactive components
import { StagingAreaVisualizer } from '@/components/specialized/part-2/StagingAreaVisualizer';
import { VersioningDemo } from '@/components/specialized/part-1/VersioningDemo';
import { GitFlowDiagram } from '@/components/visualizations/GitGraph';
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

// Create a map from component name strings to actual components
const componentMap: Record<string, React.ComponentType> = {
    StagingAreaVisualizer,
    VersioningDemo,
    GitFlowDiagram,
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
};

type LessonViewProps = {
    lesson: Lesson;
};

export function LessonView({ lesson }: LessonViewProps) {
    const InteractiveComponent = lesson.componentName ? componentMap[lesson.componentName] : null;

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
                <div className="mt-8">
                    <InteractiveComponent />
                </div>
            )}
        </div>
    );
}

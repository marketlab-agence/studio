import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lesson } from '@/types/tutorial.types';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Lightbulb } from 'lucide-react';
import { Progress } from '../ui/progress';

type LessonViewProps = {
    lesson: Lesson;
};

export function LessonView({ lesson }: LessonViewProps) {
    const InteractiveComponent = lesson.component;

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

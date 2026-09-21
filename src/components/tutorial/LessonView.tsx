
import React from 'react';
import { Lesson } from '@/types/tutorial.types';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Lightbulb } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { resolveComponent } from '@/components/registry';

/**
 * Rend une leçon : contenu markdown, mise en pratique (composant interactif)
 * et visualisation (composant visuel).
 *
 * Les composants sont résolus via le registre unique (`src/components/registry.ts`).
 * La résolution est volontairement **tolérante** ici : un nom inconnu n'empêche
 * pas l'affichage de la leçon (il est signalé en console). La validation stricte
 * (nom connu + bonne nature) s'applique au moment de la **création**, pas du rendu —
 * sinon un contenu existant cesserait de s'afficher.
 */
type LessonViewProps = {
    lesson: Lesson;
};

export function LessonView({ lesson }: LessonViewProps) {
    const { course } = useTutorial();

    const interactiveEntry = lesson.interactiveComponentName
        ? resolveComponent(lesson.interactiveComponentName)
        : undefined;
    const visualEntry = lesson.visualComponentName
        ? resolveComponent(lesson.visualComponentName)
        : undefined;

    if (process.env.NODE_ENV !== 'production') {
        if (lesson.interactiveComponentName && !interactiveEntry) {
            console.warn(
                `[LessonView] interactiveComponentName inconnu : "${lesson.interactiveComponentName}" (leçon ${lesson.id}).`,
            );
        }
        if (lesson.visualComponentName && !visualEntry) {
            console.warn(
                `[LessonView] visualComponentName inconnu : "${lesson.visualComponentName}" (leçon ${lesson.id}).`,
            );
        }
    }

    const InteractiveComponent = interactiveEntry?.component ?? null;
    const VisualComponent = visualEntry?.component ?? null;

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
                    code({node, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
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

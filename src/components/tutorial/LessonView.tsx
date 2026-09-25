
import React from 'react';
import { Lesson } from '@/types/tutorial.types';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Lightbulb } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { resolveComponent } from '@/components/registry';

/**
 * Rend une leçon : contenu markdown, puis ses composants pédagogiques **ordonnés**.
 *
 * ⚠️ **Autant de composants que la leçon en porte**, et le **même composant peut
 * apparaître plusieurs fois** (deux procédures, deux quiz) — c'est la `position`
 * qui définit l'enchaînement, pas la nature du composant.
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

    /**
     * ⚠️ **Ordre par `position`, pas par nature.** Une leçon peut enchaîner
     * plusieurs composants du même type : c'est la position qui porte la
     * progression pédagogique décidée par le créateur.
     */
    const composants = [...(lesson.components ?? [])].sort((a, b) => a.position - b.position);

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

            {composants.map((entree) => {
                const resolved = resolveComponent(entree.name);

                // ⚠️ Un composant inconnu est **signalé**, jamais ignoré en silence :
                // il disparaîtrait de la leçon sans que personne ne le sache.
                if (!resolved) {
                    console.error(
                        `[LessonView] composant inconnu : « ${entree.name} » (leçon ${lesson.id}).`,
                    );
                    return null;
                }

                const Composant = resolved.component;
                // ⚠️ La clé combine le nom ET la position : le même composant peut
                // apparaître deux fois, une clé fondée sur le seul nom serait dupliquée.
                return (
                    <div key={`${entree.name}-${entree.position}`} className="mt-12">
                        <Composant {...componentProps} config={entree.config ?? {}} />
                    </div>
                );
            })}
        </div>
    );
}

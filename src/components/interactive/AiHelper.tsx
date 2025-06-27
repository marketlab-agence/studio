'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { getGitHelp } from '@/ai/flows/git-helper-flow';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useTutorial } from '@/contexts/TutorialContext';

export function AiHelper() {
    const { currentLesson } = useTutorial();
    const [query, setQuery] = useState('git rebase -i HEAD~3');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResponse('');

        try {
            const result = await getGitHelp({
                userInput: query,
                lessonContext: currentLesson?.title || 'General Git usage'
            });
            setResponse(result.explanation);
        } catch (e) {
            console.error(e);
            setError("Désolé, une erreur est survenue. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="my-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Playground IA Katalyst
                </CardTitle>
                <CardDescription>
                    Posez une question sur Git, demandez une explication sur une commande, ou demandez à corriger une erreur.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="Ex: Quelle est la différence entre `git merge` et `git rebase` ?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="font-code"
                    rows={3}
                />
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Demander à l'IA
                </Button>
                
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {response && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                         <ReactMarkdown
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    return !inline ? (
                                    <CodeBlock className="my-4 text-sm">{String(children).replace(/\n$/, '')}</CodeBlock>
                                    ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                    );
                                }
                            }}
                         >
                            {response}
                        </ReactMarkdown>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

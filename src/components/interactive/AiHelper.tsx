
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { getGitHelp } from '@/ai/flows/git-helper-flow';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type AiHelperProps = {
    lessonContext?: string;
    courseTopic?: string;
};

export function AiHelper({ lessonContext = "Assistant IA Général", courseTopic = "Git et GitHub" }: AiHelperProps) {
    // Determine the default query based on the course topic.
    const getDefaultQuery = (topic: string) => topic.toLowerCase().includes('git') ? 'git rebase -i HEAD~3' : '';
    
    const [query, setQuery] = useState(getDefaultQuery(courseTopic));
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [responseLength, setResponseLength] = useState<'Court' | 'Moyen' | 'Long'>('Moyen');
    
    // Update the query if the course topic changes.
    useEffect(() => {
        setQuery(getDefaultQuery(courseTopic));
    }, [courseTopic]);


    const placeholderQuery = courseTopic.toLowerCase().includes('git') 
        ? 'Quelle est la différence entre `git merge` et `git rebase` ?'
        : `Donnez-moi un exemple de ${courseTopic}.`;
        
    const handleSubmit = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResponse('');

        try {
            const result = await getGitHelp({
                userInput: query,
                lessonContext,
                courseTopic,
                responseLength
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
                    Posez une question sur {courseTopic}, demandez une explication sur un concept, ou demandez à corriger une erreur.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Longueur de la réponse</Label>
                   <RadioGroup defaultValue="Moyen" value={responseLength} onValueChange={(value: 'Court' | 'Moyen' | 'Long') => setResponseLength(value)} className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Court" id="r1" />
                          <Label htmlFor="r1">Courte</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Moyen" id="r2" />
                          <Label htmlFor="r2">Moyenne</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Long" id="r3" />
                          <Label htmlFor="r3">Longue</Label>
                      </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-query">Votre question</Label>
                  <Textarea
                      id="ai-query"
                      placeholder={placeholderQuery}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="font-code"
                      rows={3}
                  />
                </div>
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

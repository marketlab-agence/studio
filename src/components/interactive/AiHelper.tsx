
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { getContextualHelp } from '@/ai/flows/contextual-helper-flow';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '../ui/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

type AiHelperProps = {
    lessonContext: string;
    courseTopic: string;
    /**
     * Configuration de l'instance : libellés (langue du créateur).
     * ⚠️ `config.data` n'est pas consommée : les options de longueur sont un état interne.
     */
    config?: ComponentConfig;
};

export function AiHelper({ lessonContext, courseTopic, config }: AiHelperProps) {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [responseLength, setResponseLength] = useState<'Court' | 'Moyen' | 'Long'>('Moyen');
    // ⚠️ Défaut = texte historique : rendu identique sans configuration.
    const libelles = fusionnerLibelles(
        {
            title: 'Playground IA Katalyst',
            askButton: "Demander à l'IA",
        },
        config?.labels,
    );


    const placeholderQuery = courseTopic.toLowerCase().includes('git') 
        ? 'Quelle est la différence entre `git merge` et `git rebase` ?'
        : `Donnez-moi un exemple concret de ${courseTopic.toLowerCase()}.`;
        
    const handleSubmit = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResponse('');

        try {
            const result = await getContextualHelp({
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
                    {libelles.title}
                </CardTitle>
                <CardDescription>
                    Posez une question sur <span className="font-semibold">{courseTopic}</span>, demandez une explication sur un concept, ou demandez à corriger une erreur.
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
                <Button onClick={handleSubmit} disabled={isLoading || !query.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    {libelles.askButton}
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
                                code({ node, className, children, ...props }) {
                                    // react-markdown v9 ne fournit plus `inline`.
                                    // Un bloc est détecté par une langue déclarée ou un retour à la ligne.
                                    const isBlock = /language-(\w+)/.test(className || '')
                                        || String(children).includes('\n');
                                    return isBlock ? (
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

'use client';

import React, { useState } from 'react';
import { GitPullRequestArrow, CheckCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CodeBlock } from '../ui/CodeBlock';

const INCOMING_CHANGES = `const greeting = "Hello, Universe!";`;
const CURRENT_CHANGES = `const greeting = "Bonjour, Monde!";`;

const CONFLICT_TEMPLATE = `<<<<<<< HEAD (votre branche actuelle)
${CURRENT_CHANGES}
=======
${INCOMING_CHANGES}
>>>>>>> feature-branch (branche entrante)`;

export function ConflictResolver() {
  const [status, setStatus] = useState<'unresolved' | 'resolved'>('unresolved');
  const [resolvedContent, setResolvedContent] = useState('');

  const handleResolve = (chosenContent: string) => {
    setResolvedContent(chosenContent);
    setStatus('resolved');
  };

  const handleReset = () => {
    setStatus('unresolved');
    setResolvedContent('');
  };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequestArrow className="h-5 w-5 text-destructive" />
          Résolveur de Conflits Interactif
        </CardTitle>
        <CardDescription>
          Apprenez à identifier et à résoudre les conflits de fusion en choisissant quelle version conserver.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'unresolved' && (
            <Alert variant="destructive">
                <GitPullRequestArrow className="h-4 w-4"/>
                <AlertTitle>Conflit de Fusion Détecté !</AlertTitle>
                <AlertDescription>
                Git ne peut pas fusionner automatiquement car les deux branches ont modifié la même ligne. Vous devez choisir la version à conserver.
                </AlertDescription>
            </Alert>
        )}

        {status === 'resolved' && (
            <Alert className="bg-green-500/10 border-green-500/50">
                <CheckCircle className="h-4 w-4 text-green-500"/>
                <AlertTitle>Conflit Résolu !</AlertTitle>
                <AlertDescription>
                    Vous avez résolu le conflit. La prochaine étape serait de faire `git add` sur le fichier puis `git commit` pour finaliser la fusion.
                </AlertDescription>
            </Alert>
        )}

        <CodeBlock className="text-sm">
            {status === 'unresolved' ? CONFLICT_TEMPLATE : resolvedContent}
        </CodeBlock>

        {status === 'unresolved' ? (
            <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleResolve(CURRENT_CHANGES)}>
                    Conserver ma version (HEAD)
                </Button>
                <Button onClick={() => handleResolve(INCOMING_CHANGES)} variant="outline">
                    Accepter la version entrante
                </Button>
            </div>
        ) : (
             <Button onClick={handleReset} variant="secondary">
                Simuler un autre conflit
            </Button>
        )}
        
        <Alert>
            <Lightbulb className="h-4 w-4"/>
            <AlertTitle>Que se passe-t-il ici ?</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><code className="font-semibold bg-muted px-1 py-0.5 rounded">{'<<<<<<< HEAD'}</code> indique le début de vos changements locaux.</li>
                    <li><code className="font-semibold bg-muted px-1 py-0.5 rounded">{'======='}</code> sépare vos changements de ceux de la branche entrante.</li>
                    <li><code className="font-semibold bg-muted px-1 py-0.5 rounded">{'>>>>>>>'}</code> indique la fin des changements de la branche entrante.</li>
                </ul>
            </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}

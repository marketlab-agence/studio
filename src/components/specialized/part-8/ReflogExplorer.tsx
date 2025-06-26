'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const reflogEntries = [
  { hash: 'f0a4f21', ref: 'HEAD@{0}', action: 'commit:', message: 'feat: add user authentication' },
  { hash: 'c3b5d1e', ref: 'HEAD@{1}', action: 'reset:', message: 'moving to HEAD~1' },
  { hash: 'a2g4h5j', ref: 'HEAD@{2}', action: 'commit:', message: 'WIP: something broken' },
  { hash: 'a2g4h5j', ref: 'HEAD@{3}', action: 'checkout:', message: 'moving from main to feature/login' },
  { hash: 'k9l8m7n', ref: 'HEAD@{4}', action: 'commit:', message: 'docs: update README' },
];

export function ReflogExplorer() {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary"/>
            Explorateur Reflog
        </CardTitle>
        <CardDescription>
          Le `reflog` est le filet de sécurité de Git. Il enregistre tous les mouvements de `HEAD`.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>À quoi ça sert ?</AlertTitle>
          <AlertDescription>
            Si vous avez "perdu" un commit (par exemple avec un `git reset --hard` malencontreux), `git reflog` est votre meilleur ami pour le retrouver. Chaque ligne représente une action que vous avez faite. Vous pouvez revenir à n'importe lequel de ces états avec `git reset --hard {ref}` (ex: `git reset --hard HEAD@{2}`).
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-muted rounded-md font-code text-sm">
          <p className="text-muted-foreground">$ git reflog</p>
          <ScrollArea className="h-48 mt-2">
            {reflogEntries.map((entry) => (
              <div key={entry.ref} className="flex items-center gap-4 whitespace-nowrap">
                <span className="text-yellow-400">{entry.hash}</span>
                <span className="text-green-400">{entry.ref}:</span>
                <span className="text-muted-foreground">{entry.action}</span>
                <span className="text-foreground truncate">{entry.message}</span>
              </div>
            ))}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

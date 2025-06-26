'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GitCommit, History, Pencil, Undo2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Commit = {
  id: string;
  message: string;
  timestamp: string;
  content: string;
};

const initialContent = `# Mon Projet
Ceci est le fichier README de mon projet.
Il est pour l'instant assez simple.
`;

const initialCommits: Commit[] = [
  {
    id: 'a1b2c3d',
    message: 'Commit initial',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    content: initialContent,
  },
];

export function VersioningDemo() {
  const [commits, setCommits] = useState<Commit[]>(initialCommits);
  const [currentContent, setCurrentContent] = useState<string>(initialContent);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedCommitId, setSelectedCommitId] = useState<string>(initialCommits[0].id);

  const handleCommit = () => {
    if (!commitMessage.trim()) return;

    const newCommit: Commit = {
      id: Math.random().toString(36).substring(2, 9),
      message: commitMessage,
      timestamp: new Date().toISOString(),
      content: currentContent,
    };

    setCommits((prev) => [newCommit, ...prev]);
    setCommitMessage('');
    setIsEditing(false);
    setSelectedCommitId(newCommit.id);
  };

  const handleRestore = (commit: Commit) => {
    setCurrentContent(commit.content);
    setSelectedCommitId(commit.id);
    setIsEditing(false);
  };

  const selectedCommit = commits.find(c => c.id === selectedCommitId);

  return (
    <Card className="my-6 border-border/50 bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>Démonstration du Versioning</CardTitle>
        <CardDescription>Découvrez comment Git sauvegarde les versions de vos fichiers dans le temps.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* History Column */}
          <div className="md:col-span-1">
            <h4 className="mb-2 font-semibold">Historique des versions</h4>
            <Card className="bg-muted/50">
              <ScrollArea className="h-64">
                <CardContent className="p-2">
                  {commits.map((commit) => (
                    <button
                      key={commit.id}
                      onClick={() => handleRestore(commit)}
                      className={cn(
                        'mb-2 w-full rounded-md p-3 text-left transition-colors',
                        selectedCommitId === commit.id
                          ? 'bg-primary/20 text-primary-foreground'
                          : 'hover:bg-primary/10'
                      )}
                    >
                      <p className="font-semibold">{commit.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {commit.id} - {new Date(commit.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>

          {/* File Viewer Column */}
          <div className="md:col-span-2">
             <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Fichier : README.md</h4>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {isEditing ? 'Annuler' : 'Modifier'}
                </Button>
            </div>
            <Card className="bg-muted/50">
              <ScrollArea className="h-64">
                <CardContent className="p-4">
                  {isEditing ? (
                    <Textarea
                      value={currentContent}
                      onChange={(e) => setCurrentContent(e.target.value)}
                      className="h-full min-h-[220px] resize-none font-code"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-code text-sm">{selectedCommit?.content}</pre>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        </div>

        {/* Commit Action Row */}
        <div className="mt-6">
          <h4 className="mb-2 font-semibold">Effectuer un nouveau commit</h4>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <Input
                placeholder="Message du commit (ex: 'Mise à jour du README')"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCommit} disabled={!commitMessage.trim()}>
                <GitCommit className="mr-2 h-4 w-4" />
                Commit les changements
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

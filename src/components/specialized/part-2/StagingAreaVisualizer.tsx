'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { File, GitCommitHorizontal, Inbox, Server, PlusCircle, MinusCircle, History } from 'lucide-react';

type FileStatus = 'untracked' | 'modified' | 'staged' | 'committed';

type FileItem = {
  path: string;
  status: FileStatus;
};

const initialWorkingDirectory: FileItem[] = [
  { path: 'index.html', status: 'modified' },
  { path: 'styles.css', status: 'untracked' },
  { path: 'app.js', status: 'modified' },
];

const initialRepository: FileItem[] = [
  { path: 'package.json', status: 'committed' },
  { path: 'README.md', status: 'committed' },
];

export function StagingAreaVisualizer() {
  const [workingDir, setWorkingDir] = useState<FileItem[]>(initialWorkingDirectory);
  const [stagingArea, setStagingArea] = useState<FileItem[]>([]);
  const [repository, setRepository] = useState<FileItem[]>(initialRepository);
  const [commits, setCommits] = useState<string[]>(['Commit initial']);

  const handleStageFile = useCallback((fileToStage: FileItem) => {
    setWorkingDir(prev => prev.filter(f => f.path !== fileToStage.path));
    setStagingArea(prev => [...prev, { ...fileToStage, status: 'staged' }]);
  }, []);

  const handleUnstageFile = useCallback((fileToUnstage: FileItem) => {
    setStagingArea(prev => prev.filter(f => f.path !== fileToUnstage.path));
    // Ceci est une simplification. Pour ce visualiseur, nous le remettrons en 'modifié'.
    setWorkingDir(prev => [...prev, { ...fileToUnstage, status: 'modified' }]);
  }, []);

  const handleCommit = useCallback(() => {
    if (stagingArea.length === 0) return;
    
    const newCommitMessage = `Commit de ${stagingArea.map(f => f.path).join(', ')}`;
    
    setRepository(prev => [...prev, ...stagingArea.map(f => ({ ...f, status: 'committed' }))]);
    setStagingArea([]);
    setCommits(prev => [newCommitMessage, ...prev]);
  }, [stagingArea]);
  
  const handleReset = useCallback(() => {
    setWorkingDir(initialWorkingDirectory);
    setStagingArea([]);
    setRepository(initialRepository);
    setCommits(['Commit initial']);
  }, []);

  const InteractiveFileItem = ({ file, onStage, onUnstage }: { file: FileItem; onStage?: (file: FileItem) => void; onUnstage?: (file: FileItem) => void; }) => (
    <div className={cn(
      "flex items-center justify-between gap-2 p-2 rounded-md text-sm transition-all",
      file.status === 'untracked' && 'bg-yellow-500/10 text-yellow-300',
      file.status === 'modified' && 'bg-blue-500/10 text-blue-300',
      file.status === 'staged' && 'bg-green-500/10 text-green-300',
      file.status === 'committed' && 'bg-card/50 text-muted-foreground'
    )}>
      <div className="flex items-center gap-2">
        <File className="h-4 w-4" />
        <span>{file.path}</span>
        {file.status !== 'committed' && <span className="text-xs opacity-70">({file.status})</span>}
      </div>
      {onStage && (
        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-400 hover:text-green-300" onClick={() => onStage(file)} aria-label={`Stage ${file.path}`}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      )}
      {onUnstage && (
        <Button size="icon" variant="ghost" className="h-6 w-6 text-yellow-400 hover:text-yellow-300" onClick={() => onUnstage(file)} aria-label={`Unstage ${file.path}`}>
          <MinusCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <Card className="my-6 bg-transparent border-border/50">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Visualiseur Interactif des 3 Zones</CardTitle>
                <CardDescription>
                  Cliquez sur les icônes pour déplacer les fichiers entre les zones.
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
                <History className="mr-2 h-4 w-4" />
                Réinitialiser
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="rounded-lg border border-dashed border-border p-4 flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Inbox className="h-5 w-5 text-blue-400" />Répertoire de travail</h3>
            <div className="space-y-2 flex-1 min-h-[150px]">
              {workingDir.length > 0 
                ? workingDir.map(f => <InteractiveFileItem key={f.path} file={f} onStage={handleStageFile} />)
                : <p className="text-xs text-muted-foreground p-2 text-center h-full flex items-center justify-center">Le répertoire de travail est propre.</p>
              }
            </div>
          </div>
          
          <div className="rounded-lg border border-dashed border-border p-4 flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Server className="h-5 w-5 text-green-400" />Zone de Staging</h3>
             <div className="space-y-2 flex-1 min-h-[150px]">
              {stagingArea.length > 0 
                ? stagingArea.map(f => <InteractiveFileItem key={f.path} file={f} onUnstage={handleUnstageFile}/>)
                : <p className="text-xs text-muted-foreground p-2 text-center h-full flex items-center justify-center">Aucun fichier préparé pour le commit.</p>
              }
            </div>
            <Button onClick={handleCommit} disabled={stagingArea.length === 0} className="mt-4">
                <GitCommitHorizontal className="mr-2 h-4 w-4" />
                Commit
            </Button>
          </div>

          <div className="rounded-lg border border-dashed border-border p-4 flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><GitCommitHorizontal className="h-5 w-5 text-primary" />Dépôt (.git)</h3>
            <div className="space-y-2 flex-1 min-h-[150px]">
              {repository.length > 0 
                ? repository.map(f => <InteractiveFileItem key={f.path} file={f}/>)
                : <p className="text-xs text-muted-foreground p-2 text-center h-full flex items-center justify-center">Aucun fichier validé.</p>
              }
            </div>
            <Card className="mt-4 bg-muted/50">
                <CardHeader className="p-2 border-b">
                    <CardTitle className="text-sm">Historique des commits</CardTitle>
                </CardHeader>
                <CardContent className="p-2 text-xs max-h-24 overflow-y-auto">
                    {commits.map((msg, i) => <p key={i} className="truncate" title={msg}>&bull; {msg}</p>)}
                </CardContent>
            </Card>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}

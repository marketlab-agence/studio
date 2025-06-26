'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, GitCommitHorizontal, Server, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Commit = {
  id: string;
  message: string;
};

const initialLocalCommits: Commit[] = [
    { id: 'c3', message: 'feat: add user profile' },
    { id: 'c2', message: 'fix: login button style' },
];

const initialRemoteCommits: Commit[] = [
    { id: 'c1', message: 'docs: update README' },
];

export function PushPullAnimator() {
  const [localCommits, setLocalCommits] = useState<Commit[]>(initialLocalCommits);
  const [remoteCommits, setRemoteCommits] = useState<Commit[]>(initialRemoteCommits);

  const handlePush = () => {
    if (localCommits.length === 0) return;
    const commitToPush = localCommits.find(lc => !remoteCommits.some(rc => rc.id === lc.id));
    if (commitToPush) {
      setRemoteCommits([commitToPush, ...remoteCommits]);
    }
  };
  
  const handlePull = () => {
    const newCommitsToPull = remoteCommits.filter(rc => !localCommits.some(lc => lc.id === rc.id));
    if (newCommitsToPull.length > 0) {
        setLocalCommits([...newCommitsToPull, ...localCommits].sort((a,b) => b.id.localeCompare(a.id)));
    }
  };

  const handleReset = () => {
    setLocalCommits(initialLocalCommits);
    setRemoteCommits(initialRemoteCommits);
  };
  
  const canPush = localCommits.some(lc => !remoteCommits.some(rc => rc.id === lc.id));
  const canPull = remoteCommits.some(rc => !localCommits.some(lc => lc.id === rc.id));

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary"/>
            Animateur Push & Pull
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[250px]">
        {/* Local Repository */}
        <div className="border rounded-lg p-4 flex flex-col">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><HardDrive className="h-5 w-5 text-blue-400"/> Dépôt Local</h3>
            <div className="flex-1 space-y-2">
                <AnimatePresence>
                    {localCommits.map(commit => (
                         <motion.div
                            key={commit.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3 }}
                            className="bg-muted p-2 rounded-md text-sm flex items-center gap-2"
                        >
                            <GitCommitHorizontal className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-mono text-xs">{commit.id}</span>
                            <span>-</span>
                            <span className="truncate">{commit.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>

        {/* Remote Repository */}
        <div className="border rounded-lg p-4 flex flex-col">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Server className="h-5 w-5 text-green-400"/> Dépôt Distant (origin)</h3>
            <div className="flex-1 space-y-2">
                <AnimatePresence>
                    {remoteCommits.map(commit => (
                        <motion.div
                            key={commit.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="bg-muted p-2 rounded-md text-sm flex items-center gap-2"
                        >
                            <GitCommitHorizontal className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-mono text-xs">{commit.id}</span>
                            <span>-</span>
                            <span className="truncate">{commit.message}</span>
                        </motion.div>
                    ))}
                 </AnimatePresence>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={handlePush} disabled={!canPush}>Push (Envoyer)</Button>
        <Button onClick={handlePull} variant="outline" disabled={!canPull}>Pull (Récupérer)</Button>
        <Button onClick={handleReset} variant="ghost" className="ml-auto">Réinitialiser</Button>
      </CardFooter>
    </Card>
  );
}

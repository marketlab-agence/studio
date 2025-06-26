'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, GitCommitHorizontal, GitMerge, Rocket, Bug, Plus, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Commit = { id: string; message: string };
type Branches = {
  main: Commit[];
  develop: Commit[];
  features: Record<string, Commit[]>;
  releases: Record<string, Commit[]>;
  hotfixes: Record<string, Commit[]>;
};

const initialCommits: { main: Commit[], develop: Commit[] } = {
  main: [{ id: `m1`, message: 'v1.0.0' }],
  develop: [{ id: `d1`, message: 'Initial dev commit' }],
};

const initialState: Branches = {
  main: initialCommits.main,
  develop: initialCommits.develop,
  features: {},
  releases: {},
  hotfixes: {},
};

export function WorkflowSimulator() {
  const [branches, setBranches] = useState<Branches>(initialState);
  const [featureCounter, setFeatureCounter] = useState(1);
  const [releaseCounter, setReleaseCounter] = useState(1);
  const { toast } = useToast();

  const handleReset = () => {
    setBranches(initialState);
    setFeatureCounter(1);
    setReleaseCounter(1);
  };

  const handleNewFeature = () => {
    const featureName = `feature/f${featureCounter}`;
    setFeatureCounter(prev => prev + 1);
    setBranches(prev => ({
      ...prev,
      features: { ...prev.features, [featureName]: [...prev.develop] }
    }));
    toast({ title: 'Nouvelle Feature', description: `Branche '${featureName}' créée à partir de 'develop'.` });
  };

  const handleFinishFeature = (featureName: string) => {
    setBranches(prev => {
      const featureCommits = prev.features[featureName].filter(fc => !prev.develop.some(dc => dc.id === fc.id));
      const newDevelop = [...prev.develop, ...featureCommits, { id: `merge-${featureName.split('/')[1]}`, message: `Merge ${featureName}` }];
      const { [featureName]: _, ...remainingFeatures } = prev.features;
      return { ...prev, develop: newDevelop, features: remainingFeatures };
    });
    toast({ title: 'Feature Terminée', description: `Branche '${featureName}' fusionnée dans 'develop'.` });
  };
  
  const handleStartRelease = () => {
    const releaseName = `release/v1.${releaseCounter}.0`;
    setReleaseCounter(prev => prev + 1);
    setBranches(prev => ({
      ...prev,
      releases: { ...prev.releases, [releaseName]: [...prev.develop] }
    }));
    toast({ title: 'Nouvelle Release', description: `Branche '${releaseName}' créée à partir de 'develop'.` });
  };
  
  const handleFinishRelease = (releaseName: string) => {
    setBranches(prev => {
        const releaseCommits = prev.releases[releaseName];
        const newMain = [...prev.main, ...releaseCommits.filter(rc => !prev.main.some(mc => mc.id === rc.id)), {id: `tag-${releaseName.split('/')[1]}`, message: releaseName.split('/')[1]}];
        const newDevelop = [...prev.develop, ...releaseCommits.filter(rc => !prev.develop.some(dc => dc.id === rc.id)), {id: `merge-release-${releaseName.split('/')[1]}`, message: `Merge ${releaseName}`}];
        const { [releaseName]: _, ...remainingReleases } = prev.releases;
        return { ...prev, main: newMain, develop: newDevelop, releases: remainingReleases};
    });
    toast({ title: 'Release Terminée', description: `Branche '${releaseName}' fusionnée dans 'main' et 'develop'.` });
  }

  const BranchColumn = ({ name, commits, color, children }: { name: string, commits: Commit[], color: string, children?: React.ReactNode }) => (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/50 min-h-[200px]">
      <div className="font-bold text-center flex items-center justify-center gap-2">
        <GitBranch className={cn("h-4 w-4", color)} />
        {name}
      </div>
      <div className="space-y-2">
        <AnimatePresence>
            {commits.map(commit => (
                <motion.div
                    key={commit.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-2 bg-background rounded-md text-xs flex items-center gap-2 border"
                >
                    <GitCommitHorizontal className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{commit.message}</span>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
      {children && <div className="mt-auto pt-2">{children}</div>}
    </div>
  );

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Simulateur de Workflow GitFlow</CardTitle>
        <CardDescription>Visualisez le flux GitFlow en créant des features, releases, et hotfixes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 p-4 border rounded-lg mb-6">
            <Button size="sm" onClick={handleNewFeature}><Plus className="mr-2"/> Nouvelle Feature</Button>
            <Button size="sm" onClick={handleStartRelease} variant="secondary"><Rocket className="mr-2"/> Démarrer une Release</Button>
            <Button size="sm" onClick={handleReset} variant="ghost" className="ml-auto"><History className="mr-2"/> Réinitialiser</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BranchColumn name="main" commits={branches.main} color="text-green-400" />
            <BranchColumn name="develop" commits={branches.develop} color="text-blue-400" />
            <div className="space-y-4">
                {Object.keys(branches.features).map(name => (
                    <BranchColumn key={name} name={name} commits={branches.features[name]} color="text-yellow-400">
                         <Button size="sm" className="w-full" onClick={() => handleFinishFeature(name)}>Terminer la Feature</Button>
                    </BranchColumn>
                ))}
            </div>
            <div className="space-y-4">
                {Object.keys(branches.releases).map(name => (
                    <BranchColumn key={name} name={name} commits={branches.releases[name]} color="text-purple-400">
                        <Button size="sm" className="w-full" variant="secondary" onClick={() => handleFinishRelease(name)}>Terminer la Release</Button>
                    </BranchColumn>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

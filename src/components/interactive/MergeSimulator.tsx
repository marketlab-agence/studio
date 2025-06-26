'use client';

import React, { useState } from 'react';
import { GitMerge, GitPullRequestArrow, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function MergeSimulator() {
  const [branches, setBranches] = useState(['main', 'develop', 'feature-branch', 'bug-fix']);
  const [sourceBranch, setSourceBranch] = useState('feature-branch');
  const [targetBranch, setTargetBranch] = useState('main');
  const [simulationResult, setSimulationResult] = useState<{ type: 'success' | 'conflict' | 'error', message: string } | null>(null);

  const handleMerge = () => {
    if (sourceBranch === targetBranch) {
        setSimulationResult({ type: 'error', message: "Vous ne pouvez pas fusionner une branche avec elle-même." });
        return;
    }
    
    // Simple simulation logic
    if (sourceBranch === 'bug-fix' && targetBranch === 'develop') {
      setSimulationResult({ type: 'conflict', message: `Conflit de fusion détecté ! Des changements concurrents ont été faits sur la branche '${targetBranch}'.` });
    } else {
      setSimulationResult({ type: 'success', message: `La branche '${sourceBranch}' a été fusionnée avec succès dans '${targetBranch}'.` });
    }
  };

  const availableSourceBranches = branches.filter(b => b !== targetBranch);
  const availableTargetBranches = branches.filter(b => b !== sourceBranch);

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-primary" />
          Simulateur de Fusion de Branches
        </CardTitle>
        <CardDescription>
          Expérimentez avec la fusion de branches et voyez les résultats possibles, y compris les conflits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Fusionner la branche</label>
                <Select value={sourceBranch} onValueChange={setSourceBranch}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableSourceBranches.map(branch => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="text-center mt-6 font-bold text-muted-foreground">&rarr;</div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Dans la branche</label>
                <Select value={targetBranch} onValueChange={setTargetBranch}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableTargetBranches.map(branch => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <Button onClick={handleMerge} className="w-full sm:w-auto">
          <GitMerge className="mr-2 h-4 w-4" />
          Tenter la fusion
        </Button>

        {simulationResult && (
            <Alert variant={simulationResult.type === 'conflict' || simulationResult.type === 'error' ? 'destructive' : 'default'} className={simulationResult.type === 'success' ? 'bg-green-500/10 border-green-500/50' : ''}>
                {simulationResult.type === 'conflict' && <GitPullRequestArrow className="h-4 w-4" />}
                {simulationResult.type === 'success' && <CheckCircle className="h-4 w-4" />}
                <AlertTitle>
                    {simulationResult.type === 'success' && 'Fusion Réussie !'}
                    {simulationResult.type === 'conflict' && 'Conflit de Fusion Simulé'}
                    {simulationResult.type === 'error' && 'Erreur'}
                </AlertTitle>
                <AlertDescription>
                    {simulationResult.message}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}

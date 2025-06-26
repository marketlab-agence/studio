'use client';

import React, { useState } from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function BranchCreator() {
  const [branches, setBranches] = useState(['main', 'develop']);
  const [newBranchName, setNewBranchName] = useState('');
  const [currentBranch, setCurrentBranch] = useState('main');
  const { toast } = useToast();

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) {
      toast({ title: "Erreur", description: "Le nom de la branche ne peut pas être vide.", variant: "destructive" });
      return;
    }
    if (branches.includes(newBranchName.trim())) {
      toast({ title: "Erreur", description: `La branche "${newBranchName}" existe déjà.`, variant: "destructive" });
      return;
    }
    const branchName = newBranchName.trim().replace(/\s+/g, '-');
    setBranches([...branches, branchName]);
    setNewBranchName('');
    toast({ title: "Succès", description: `Branche "${branchName}" créée.` });
  };

  const handleDeleteBranch = (branchName: string) => {
    if (branchName === 'main') {
        toast({ title: "Action impossible", description: "Vous ne pouvez pas supprimer la branche principale.", variant: "destructive"});
        return;
    }
    if (branchName === currentBranch) {
        toast({ title: "Action impossible", description: "Vous ne pouvez pas supprimer la branche actuelle.", variant: "destructive"});
        return;
    }
    setBranches(branches.filter(b => b !== branchName));
    toast({ title: "Succès", description: `Branche "${branchName}" supprimée.` });
  }

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Simulateur de Création de Branches
        </CardTitle>
        <CardDescription>
          Créez et gérez des branches pour simuler un flux de travail de développement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
            <Input 
              id="branchName" 
              placeholder="ex: nouvelle-fonctionnalite" 
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
            />
            <Button onClick={handleCreateBranch}>
              <Plus className="mr-2 h-4 w-4" />
              Créer la branche
            </Button>
        </div>
        
        <div>
            <h4 className="font-semibold mb-2">Branches existantes :</h4>
            <div className="flex flex-wrap gap-2">
                {branches.map(branch => (
                    <div key={branch} className="flex items-center">
                        <Badge 
                            variant={currentBranch === branch ? 'default' : 'secondary'}
                            className="cursor-pointer rounded-r-none"
                            onClick={() => setCurrentBranch(branch)}
                        >
                            <GitBranch className="mr-2 h-3 w-3"/>
                            {branch}
                            {currentBranch === branch && <span className="ml-2 text-xs opacity-75">(actuelle)</span>}
                        </Badge>
                        {branch !== 'main' && (
                             <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-full rounded-l-none border border-l-0 hover:bg-destructive/20"
                                onClick={() => handleDeleteBranch(branch)}
                            >
                                <Trash2 className="h-3 w-3 text-destructive"/>
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

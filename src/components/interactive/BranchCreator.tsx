import React from 'react';
import { GitBranch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BranchCreator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Créateur de Branches
        </CardTitle>
        <CardDescription>
          Créez une nouvelle branche pour travailler sur une nouvelle fonctionnalité.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <label htmlFor="branchName" className="text-sm font-medium">Nom de la nouvelle branche</label>
            <Input id="branchName" placeholder="ex: nouvelle-fonctionnalite" />
        </div>
        <Button>
          <GitBranch className="mr-2 h-4 w-4" />
          Créer la branche
        </Button>
      </CardContent>
    </Card>
  );
}

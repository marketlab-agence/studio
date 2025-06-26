import React from 'react';
import { Project, Workflow } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WorkflowDesigner() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          Designer de Workflow Git
        </CardTitle>
        <CardDescription>
          Concevez et visualisez différents workflows Git comme GitFlow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-md min-h-[150px] flex items-center justify-center">
            <p className="text-muted-foreground">Espace de conception du workflow (glisser-déposer)</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">Ajouter une étape 'Feature'</Button>
            <Button variant="outline">Ajouter une étape 'Release'</Button>
        </div>
      </CardContent>
    </Card>
  );
}

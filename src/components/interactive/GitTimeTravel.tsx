import React from 'react';
import { History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

export function GitTimeTravel({ config }: { config?: ComponentConfig }) {
  // ⚠️ Défaut = texte historique : rendu identique sans configuration.
  const libelles = fusionnerLibelles(
    {
      title: 'Machine à Remonter le Temps Git',
      description: "Naviguez dans l'historique des commits pour voir l'état du projet à différents moments.",
    },
    config?.labels,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {libelles.title}
        </CardTitle>
        <CardDescription>{libelles.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Commit initial</span>
                <span>Dernier commit</span>
            </div>
            <Slider defaultValue={[100]} max={100} step={1} />
        </div>
        <p className="text-sm text-center">Vous visualisez le commit : <span className="font-semibold">a1b2c3d - "Ajout de la fonctionnalité X"</span></p>
        <Button variant="outline">
          <History className="mr-2 h-4 w-4" />
          Revenir à ce commit (git checkout)
        </Button>
      </CardContent>
    </Card>
  );
}

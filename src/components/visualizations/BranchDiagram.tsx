import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

export function BranchDiagram({ config }: { config?: ComponentConfig }) {
  // ⚠️ Défaut = titre historique : rendu identique sans configuration.
  const libelles = fusionnerLibelles({ title: 'Diagramme des Branches' }, config?.labels);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{libelles.title}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[150px] flex items-center justify-center">
        <p className="text-muted-foreground">Visualisation animée du diagramme des branches.</p>
        {/* Un composant SVG ou Canvas irait ici */}
      </CardContent>
    </Card>
  );
}

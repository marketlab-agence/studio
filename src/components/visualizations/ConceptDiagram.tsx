import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

export function ConceptDiagram({ config }: { config?: ComponentConfig }) {
  // ⚠️ Défaut = titre historique : rendu identique sans configuration.
  const libelles = fusionnerLibelles({ title: 'Diagramme de Concept' }, config?.labels);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{libelles.title}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[150px] flex items-center justify-center bg-muted rounded-md">
        <p className="text-muted-foreground">Espace pour un diagramme de concept (ex: SVG).</p>
      </CardContent>
    </Card>
  );
}

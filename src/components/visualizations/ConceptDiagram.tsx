import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ConceptDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramme de Concept</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[150px] flex items-center justify-center bg-muted rounded-md">
        <p className="text-muted-foreground">Espace pour un diagramme de concept (ex: SVG).</p>
      </CardContent>
    </Card>
  );
}

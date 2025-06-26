import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

export function BranchDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramme des Branches</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[150px] flex items-center justify-center">
        <p className="text-muted-foreground">Visualisation animée du diagramme des branches.</p>
        {/* Un composant SVG ou Canvas irait ici */}
      </CardContent>
    </Card>
  );
}

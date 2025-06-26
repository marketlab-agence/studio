import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitMerge } from 'lucide-react';

export function GitGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Graphe Git Interactif</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[200px] flex items-center justify-center">
        <p className="text-muted-foreground">Visualisation interactive du graphe Git.</p>
        {/* Un composant plus complexe comme vis.js ou D3 irait ici */}
      </CardContent>
    </Card>
  );
}

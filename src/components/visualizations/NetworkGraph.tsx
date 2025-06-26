import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function NetworkGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Graphe du Réseau des Contributeurs</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[150px] flex items-center justify-center">
        <p className="text-muted-foreground">Visualisation du réseau des contributeurs.</p>
        {/* Un composant de graphe irait ici */}
      </CardContent>
    </Card>
  );
}

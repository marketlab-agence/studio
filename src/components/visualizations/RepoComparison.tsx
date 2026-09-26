import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitCompare } from 'lucide-react';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

export function RepoComparison({ config }: { config?: ComponentConfig }) {
  // ⚠️ Défaut = titre historique : rendu identique sans configuration.
  const libelles = fusionnerLibelles({ title: 'Comparaison Local vs Distant' }, config?.labels);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{libelles.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Dépôt Local</h4>
          <div className="bg-muted p-3 rounded-md text-sm">
            <p>main: commit a1b2c3d</p>
            <p>feature: commit f9e8d7c</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Dépôt Distant (origin)</h4>
          <div className="bg-muted p-3 rounded-md text-sm">
            <p>main: commit a1b2c3d</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

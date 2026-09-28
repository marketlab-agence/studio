import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

export function DiffViewer({ config }: { config?: ComponentConfig }) {
  // ⚠️ Défaut = titre historique : rendu identique sans configuration.
  const libelles = fusionnerLibelles({ title: 'Visualiseur de Différences' }, config?.labels);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{libelles.title}</CardTitle>
      </CardHeader>
      <CardContent className="font-code text-sm space-y-1">
        <div className="bg-red-500/10 text-red-400 p-2 rounded-md">
          - ancien contenu
        </div>
        <div className="bg-green-500/10 text-green-400 p-2 rounded-md">
          + nouveau contenu
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { GitPullRequestDraft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

export function PullRequestCreator({ config }: { config?: ComponentConfig }) {
  // ⚠️ Défaut = texte historique : rendu identique sans configuration.
  const libelles = fusionnerLibelles(
    {
      title: 'Créateur de Pull Request',
      description: "Simulez la création d'une Pull Request pour proposer des modifications.",
    },
    config?.labels,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequestDraft className="h-5 w-5 text-primary" />
          {libelles.title}
        </CardTitle>
        <CardDescription>{libelles.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <label htmlFor="pr-title" className="text-sm font-medium">Titre</label>
            <Input id="pr-title" placeholder="ex: Ajout de l'authentification" />
        </div>
        <div className="space-y-2">
            <label htmlFor="pr-description" className="text-sm font-medium">Description</label>
            <Textarea id="pr-description" placeholder="Décrivez vos changements..." />
        </div>
        <Button>
            <GitPullRequestDraft className="mr-2 h-4 w-4" />
            Créer la Pull Request
        </Button>
      </CardContent>
    </Card>
  );
}

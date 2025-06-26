import React from 'react';
import { GitPullRequestArrow } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ConflictResolver() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequestArrow className="h-5 w-5 text-destructive" />
          Résolveur de Conflits
        </CardTitle>
        <CardDescription>
          Apprenez à identifier et à résoudre les conflits de fusion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
            <AlertTitle>Conflit de Fusion Détecté !</AlertTitle>
            <AlertDescription>
            Un conflit est survenu dans `index.html`. Veuillez résoudre le conflit pour continuer.
            </AlertDescription>
        </Alert>
        <div className="font-code text-sm space-y-2 rounded-md bg-muted p-4">
            <p className="text-muted-foreground">&#60;&#60;&#60;&#60;&#60;&#60;&#60; HEAD</p>
            <p>Mon contenu original</p>
            <p className="text-muted-foreground">=======</p>
            <p>Contenu de la branche entrante</p>
            <p className="text-muted-foreground">&gt;&gt;&gt;&gt;&gt;&gt;&gt; nouvelle-fonctionnalite</p>
        </div>
        <div className="flex gap-2">
            <Button>Conserver ma version</Button>
            <Button variant="outline">Accepter la version entrante</Button>
        </div>
      </CardContent>
    </Card>
  );
}

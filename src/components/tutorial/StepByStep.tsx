import React from 'react';

export function StepByStep() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
        <div>
          <h3 className="font-semibold">Étape 1: Initialiser le dépôt</h3>
          <p className="text-muted-foreground">Ouvrez votre terminal et exécutez `git init`.</p>
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
        <div>
          <h3 className="font-semibold">Étape 2: Ajouter des fichiers</h3>
          <p className="text-muted-foreground">Créez un fichier et ajoutez-le à la zone de staging avec `git add`.</p>
        </div>
      </div>
    </div>
  );
}

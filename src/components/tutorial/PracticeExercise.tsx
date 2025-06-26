import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PracticeExercise() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercice Pratique</CardTitle>
        <CardDescription>Appliquez ce que vous venez d'apprendre.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Créez un nouveau fichier nommé `test.txt` et ajoutez-le à la zone de staging.</p>
        <Button>Voir la solution</Button>
      </CardContent>
    </Card>
  );
}

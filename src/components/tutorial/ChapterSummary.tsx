import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function ChapterSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé du Chapitre</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 mt-1 text-green-500" />
          <p>Vous avez appris à initialiser un dépôt.</p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 mt-1 text-green-500" />
          <p>Vous savez maintenant comment vérifier le statut de votre projet.</p>
        </div>
      </CardContent>
    </Card>
  );
}

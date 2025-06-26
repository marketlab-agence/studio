import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

export function ChapterIntro() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Introduction au Chapitre</CardTitle>
        <CardDescription>Objectifs d'apprentissage pour cette section.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 mt-1 text-primary" />
          <p>Comprendre le concept de contrôle de version.</p>
        </div>
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 mt-1 text-primary" />
          <p>Apprendre la différence entre Git et GitHub.</p>
        </div>
      </CardContent>
    </Card>
  );
}

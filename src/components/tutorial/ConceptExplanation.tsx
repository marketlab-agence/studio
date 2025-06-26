import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ConceptExplanation() {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Lightbulb className="h-6 w-6 text-yellow-400 mt-1" />
          <div>
            <h4 className="font-semibold">Explication du Concept</h4>
            <p className="text-muted-foreground mt-2">
              La 'zone de staging' (staging area) est une étape intermédiaire où vous pouvez préparer votre prochain commit. Elle vous permet de choisir précisément quelles modifications inclure.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

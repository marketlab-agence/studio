import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function QuizQuestion() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Question de Quiz</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium">Quelle commande est utilisée pour sauvegarder les modifications dans l'historique local ?</p>
        <RadioGroup defaultValue="option-one">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-one" id="q1-option-one" />
            <Label htmlFor="q1-option-one">git push</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-two" id="q1-option-two" />
            <Label htmlFor="q1-option-two">git commit</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-three" id="q1-option-three" />
            <Label htmlFor="q1-option-three">git add</Label>
          </div>
        </RadioGroup>
        <Button>Vérifier la réponse</Button>
      </CardContent>
    </Card>
  );
}

'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, History, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const initialConflict = `<<<<<<< HEAD
function greet() {
  console.log("Hello, World!");
}
=======
function greet() {
  console.log("Bonjour, le monde!");
}
>>>>>>> feature/french-greeting`;

export function ConflictPlayground() {
  const [content, setContent] = useState(initialConflict);
  const [isResolved, setIsResolved] = useState(false);
  const { toast } = useToast();

  const handleVerify = () => {
    if (content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>')) {
      toast({
        title: 'Conflit non résolu',
        description: 'Il semble que vous ayez oublié de supprimer tous les marqueurs de conflit de Git.',
        variant: 'destructive',
      });
      setIsResolved(false);
    } else {
      toast({
        title: 'Conflit résolu !',
        description: 'Excellent travail ! Vous avez résolu le conflit.',
      });
      setIsResolved(true);
    }
  };
  
  const handleReset = () => {
    setContent(initialConflict);
    setIsResolved(false);
  };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Terrain de Jeu pour Conflits</CardTitle>
        <CardDescription>Modifiez le texte ci-dessous pour résoudre le conflit manuellement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
            <Lightbulb className="h-4 w-4"/>
            <AlertTitle>Votre mission</AlertTitle>
            <AlertDescription>
                <ol className="list-decimal pl-5 space-y-1 mt-2">
                    <li>Décidez quelle version du code vous voulez conserver (ou combinez-les).</li>
                    <li>Supprimez les lignes avec les marqueurs de conflit : <code>{'<<<<<<< HEAD'}</code>, <code>{'======='}</code>, et <code>{'>>>>>>> ...'}</code>.</li>
                    <li>Cliquez sur "Vérifier la résolution" pour valider votre travail.</li>
                </ol>
            </AlertDescription>
        </Alert>

        <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-code min-h-[250px] bg-muted/50"
            disabled={isResolved}
        />
        
        {isResolved && (
            <Alert className="bg-green-500/10 border-green-500/50">
                <CheckCircle className="h-4 w-4 text-green-500"/>
                <AlertTitle>Résolu !</AlertTitle>
                <AlertDescription>
                    Vous avez correctement édité le fichier. La prochaine étape serait de faire `git add` et `git commit` pour finaliser la fusion.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="flex gap-2">
            <Button onClick={handleVerify} disabled={isResolved}>Vérifier la résolution</Button>
            <Button onClick={handleReset} variant="outline">
                <History className="mr-2 h-4 w-4"/>
                Réinitialiser
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

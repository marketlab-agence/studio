'use client';

import { Award, Lock } from 'lucide-react';
import Link from 'next/link';
import { useTutorial } from '@/contexts/TutorialContext';
import { CertificateGenerator } from '@/components/specialized/part-10/CertificateGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function CertificatePage() {
  const { overallProgress } = useTutorial();
  const isComplete = overallProgress >= 100;

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Votre Certificat de Réussite</h1>
            <p className="text-muted-foreground">Validez la complétion de votre apprentissage sur Git & GitHub.</p>
          </div>
        </div>

        {isComplete ? (
          <CertificateGenerator />
        ) : (
          <Card className="text-center py-8">
            <CardHeader>
              <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>Certificat Verrouillé</CardTitle>
              <CardDescription>
                Vous devez terminer l'intégralité du tutoriel pour débloquer votre certificat.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-sm mx-auto space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Votre progression actuelle :</p>
                <Progress value={overallProgress} />
                <p className="text-sm text-muted-foreground mt-2">{Math.round(overallProgress)}%</p>
              </div>
              <Button asChild>
                <Link href="/tutorial">Continuer le Tutoriel</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

'use client';

import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useTutorial } from '@/contexts/TutorialContext';
import { TUTORIALS } from '@/lib/tutorials';
import { QUIZZES } from '@/lib/quiz';
import { StatisticsChart } from '@/components/visualizations/StatisticsChart';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const { progress, overallProgress, totalCompleted, totalLessons } = useTutorial();
    const quizzes = Object.values(QUIZZES);
    const completedQuizzes = progress.quizScores ? Object.keys(progress.quizScores).length : 0;
    const averageScore = completedQuizzes > 0 
        ? Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / completedQuizzes
        : 0;

    const commitData = progress.quizScores ? Object.entries(progress.quizScores).map(([key, value]) => ({
      name: TUTORIALS.find(t => t.id === key)?.title.split('. ')[1] ?? "Chapitre",
      score: value
    })) : [];

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
          <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
              <p className="text-muted-foreground">Bienvenue ! Voici un aperçu de votre progression.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                  <CardHeader>
                      <CardTitle>Progression du Tutoriel</CardTitle>
                      <CardDescription>{totalCompleted} sur {totalLessons} leçons terminées.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Progress value={overallProgress} className="h-3" />
                      <div className="mt-4 flex justify-end">
                          <Link href="/tutorial">
                          <Button size="sm">
                              {totalCompleted > 0 ? 'Continuer le tutoriel' : 'Commencer le tutoriel'}
                              <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                          </Link>
                      </div>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader>
                      <CardTitle>Score Moyen aux Quiz</CardTitle>
                      <CardDescription>{completedQuizzes} sur {quizzes.length} quiz terminés.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center gap-4">
                      <div className="relative h-24 w-24">
                          <svg className="h-full w-full" viewBox="0 0 36 36">
                              <path
                                  className="stroke-muted"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  strokeWidth="3"
                              />
                              <path
                                  className="stroke-primary"
                                  strokeDasharray={`${averageScore}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                              />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold">{Math.round(averageScore)}%</span>
                          </div>
                      </div>
                      <p className="text-muted-foreground text-sm">Continuez pour améliorer votre score !</p>
                  </CardContent>
              </Card>
          </div>
          
          <Card>
              <CardHeader>
                  <CardTitle>Scores par Chapitre</CardTitle>
                  <CardDescription>Visualisez vos résultats pour chaque quiz de chapitre.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ChartContainer config={{ score: { label: 'Score', color: 'hsl(var(--primary))' } }} className="h-[250px]">
                    <StatisticsChart data={commitData} />
                  </ChartContainer>
              </CardContent>
          </Card>

      </div>
    </main>
  );
}

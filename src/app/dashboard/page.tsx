'use client';

import { Award, BookOpen, ChevronRight, LayoutGrid, Lock, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useTutorial } from '@/contexts/TutorialContext';
import { TUTORIALS } from '@/lib/tutorials';
import { QUIZZES } from '@/lib/quiz';
import { StatisticsChart } from '@/components/visualizations/StatisticsChart';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { progress, overallProgress, totalCompleted, totalLessons, setCurrentLocation } = useTutorial();
    
    const [isMounted, setIsMounted] = useState(false);
    const [commitData, setCommitData] = useState<{name: string, score: number}[]>([]);

    useEffect(() => {
        setIsMounted(true);
        setCommitData([
            { name: 'Jan', score: Math.floor(Math.random() * 70) + 10 },
            { name: 'Fev', score: Math.floor(Math.random() * 70) + 10 },
            { name: 'Mar', score: Math.floor(Math.random() * 70) + 10 },
            { name: 'Avr', score: Math.floor(Math.random() * 70) + 10 },
            { name: 'Mai', score: Math.floor(Math.random() * 70) + 10 },
            { name: 'Juin', score: Math.floor(Math.random() * 70) + 10 },
            { name: 'Juil', score: Math.floor(Math.random() * 70) + 10 },
        ]);
    }, []);

    const quizzes = Object.values(QUIZZES);
    const tutorials = Object.values(TUTORIALS);

    const completedQuizzes = progress.quizScores ? Object.values(progress.quizScores).filter(score => score >= 80).length : 0;
    const totalQuizzes = quizzes.length;

    const averageScore = (progress.quizScores && Object.keys(progress.quizScores).length > 0)
        ? Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / Object.keys(progress.quizScores).length
        : 0;
    
    const handleContinue = (chapterId: string, lessonId: string) => {
        setCurrentLocation(chapterId, lessonId);
    };

    if (!isMounted) {
        return (
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl space-y-8">
                  <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2">
                          <Skeleton className="h-8 w-60" />
                          <Skeleton className="h-4 w-80" />
                      </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                      <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                      <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                      <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                  </div>
              </div>
            </main>
        )
    }

    return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <LayoutGrid className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tableau de Bord</h1>
                <p className="text-muted-foreground">Suivez votre progression et vos statistiques d'apprentissage.</p>
            </div>
          </div>
          
          {overallProgress >= 100 && (
            <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Award className="h-10 w-10 text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">Félicitations !</h3>
                            <p className="text-muted-foreground">Vous avez terminé le tutoriel. Réclamez votre certificat.</p>
                        </div>
                    </div>
                    <Button asChild size="lg">
                        <Link href="/certificate">Obtenir mon certificat</Link>
                    </Button>
                </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progression</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
                    <p className="text-xs text-muted-foreground">de l'ensemble du tutoriel</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chapitres Réussis</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedQuizzes}/{totalQuizzes}</div>
                    <p className="text-xs text-muted-foreground">Quiz passés avec &gt;= 80%</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leçons Terminées</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCompleted}/{totalLessons}</div>
                     <p className="text-xs text-muted-foreground">sur l'ensemble des chapitres</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Score Quiz Moyen</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
                    <p className="text-xs text-muted-foreground">sur les quiz tentés</p>
                </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Continuer l'apprentissage</h2>
            <div className="space-y-2">
                {tutorials.map((tutorial, index) => {
                    const isFirstChapter = index === 0;
                    const prevChapter = isFirstChapter ? null : tutorials[index-1];
                    const quizScorePrevChapter = prevChapter && progress.quizScores ? (progress.quizScores[prevChapter.id] ?? 0) : 0;
                    
                    const isLocked = !isFirstChapter && quizScorePrevChapter < 80;
                    const isCompleted = (progress.quizScores?.[tutorial.id] ?? 0) >= 80;

                    return (
                        <Card key={tutorial.id} className="transition-all hover:border-primary/50">
                            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{tutorial.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{tutorial.description}</p>
                                </div>
                                {isLocked ? (
                                    <Badge variant="secondary" className="flex items-center gap-2">
                                        <Lock className="h-3 w-3" /> Verrouillé
                                    </Badge>
                                ) : (
                                    <Link href="/tutorial">
                                        <Button size="sm" onClick={() => handleContinue(tutorial.id, tutorial.lessons[0].id)}>
                                            {isCompleted ? 'Revoir' : 'Continuer'}
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Statistiques Git</CardTitle>
                  <CardDescription>Analyse de votre activité et des tendances sur ce projet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="commits">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="commits">Activité des Commits</TabsTrigger>
                        <TabsTrigger value="languages" disabled>Langages</TabsTrigger>
                        <TabsTrigger value="contributors" disabled>Contributeurs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="commits" className="space-y-4">
                        <ChartContainer config={{ score: { label: 'Score', color: 'hsl(var(--primary))' } }} className="h-[250px]">
                            <StatisticsChart data={commitData} />
                        </ChartContainer>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Total des commits</p>
                                <p className="text-2xl font-bold">65</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Moyenne par jour</p>
                                <p className="text-2xl font-bold">9.3</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Tendance</p>
                                <p className="text-2xl font-bold text-green-400">+15%</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
              </CardContent>
          </Card>

      </div>
    </main>
  );
}

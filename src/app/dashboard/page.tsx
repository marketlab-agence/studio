
'use client';

import { Award, BookOpen, ChevronRight, LayoutGrid, GitCommitHorizontal, Target, TrendingUp, History, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useTutorial } from '@/contexts/TutorialContext';
import { StatisticsChart } from '@/components/visualizations/StatisticsChart';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguagesChart } from '@/components/visualizations/LanguagesChart';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { overallProgress, totalCompleted, totalLessons, resetProgress, averageQuizScore, masteryIndex } = useTutorial();
    
    const [isMounted, setIsMounted] = useState(false);
    const [commitData, setCommitData] = useState<{name: string, commits: number}[]>([]);
    const [languagesData, setLanguagesData] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        setIsMounted(true);
        setCommitData([
            { name: 'Jan', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Fev', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Mar', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Avr', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Mai', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Juin', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Juil', commits: Math.floor(Math.random() * 50) + 10 },
        ]);
        setLanguagesData([
            { name: 'TypeScript', value: 65, fill: 'hsl(var(--chart-1))' },
            { name: 'HTML', value: 20, fill: 'hsl(var(--chart-2))' },
            { name: 'CSS', value: 15, fill: 'hsl(var(--chart-3))' },
        ]);
    }, []);

    const mainCourse = {
        id: 'git-github-tutorial',
        title: 'Git & GitHub : Le Guide Complet',
        description: 'La compétence fondamentale pour tout développeur. De la première ligne de commande à la contribution open source.',
        icon: GitCommitHorizontal,
        href: '/tutorial'
    };

    const getButtonText = () => {
        if (overallProgress >= 100) return 'Revoir la formation';
        if (overallProgress > 0) return 'Continuer';
        return 'Commencer';
    };


    if (authLoading || !user || !isMounted) {
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
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Award className="h-10 w-10 text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">Félicitations !</h3>
                            <p className="text-muted-foreground">Vous avez terminé le tutoriel. Réclamez votre certificat.</p>
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="secondary">
                                <History className="mr-2 h-4 w-4" />
                                Recommencer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous sûr de vouloir recommencer ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Toute votre progression sera effacée et vous retournerez à la première leçon. Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={resetProgress}>Confirmer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button size="lg" asChild>
                            <Link href="/certificate">Obtenir mon certificat</Link>
                        </Button>
                    </div>
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
                    <CardTitle className="text-sm font-medium">Score Moyen Quiz</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageQuizScore.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">sur les quiz réussis</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Indice de Maîtrise</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{masteryIndex.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Tentatives par quiz réussi</p>
                </CardContent>
            </Card>
          </div>
          
           <div className="space-y-4">
            <h2 className="text-xl font-bold">Ma Formation en cours</h2>
             <Card className="flex flex-col md:flex-row md:items-center gap-6 p-6 border-primary/20 hover:border-primary/50 transition-colors">
                <div className="p-4 bg-primary/10 rounded-lg w-fit self-start">
                    <mainCourse.icon className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1">
                    <CardTitle className="text-xl">{mainCourse.title}</CardTitle>
                    <CardDescription className="mt-2">{mainCourse.description}</CardDescription>
                    <div className="flex items-center gap-4 mt-4">
                        <Progress value={overallProgress} className="h-2 flex-1" />
                        <span className="text-sm font-medium text-muted-foreground">{totalCompleted} / {totalLessons} leçons</span>
                    </div>
                </div>
                <Button asChild size="lg" className="w-full md:w-auto self-center md:self-end">
                    <Link href={mainCourse.href}>
                        {getButtonText()}
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </Card>
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
                        <TabsTrigger value="languages">Langages</TabsTrigger>
                        <TabsTrigger value="contributors">Contributeurs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="commits" className="pt-4 space-y-4">
                        <ChartContainer config={{ commits: { label: 'Commits', color: 'hsl(var(--primary))' } }} className="h-[250px] w-full">
                            <StatisticsChart data={commitData} />
                        </ChartContainer>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <Card className="p-4 bg-background/50">
                                <CardHeader className="p-0 pb-2 flex-row items-center justify-center space-x-2 space-y-0">
                                    <Target className="h-5 w-5 text-muted-foreground"/>
                                    <CardTitle className="text-md font-medium">Total</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <p className="text-2xl font-bold">347 commits</p>
                                </CardContent>
                            </Card>
                            <Card className="p-4 bg-background/50">
                                <CardHeader className="p-0 pb-2 flex-row items-center justify-center space-x-2 space-y-0">
                                    <TrendingUp className="h-5 w-5 text-muted-foreground"/>
                                    <CardTitle className="text-md font-medium">Tendance</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <p className="text-2xl font-bold text-green-400">+15%</p>
                                    <p className="text-xs text-muted-foreground">vs le mois dernier</p>
                                </CardContent>
                            </Card>
                            <Card className="p-4 bg-background/50">
                                <CardHeader className="p-0 pb-2 flex-row items-center justify-center space-x-2 space-y-0">
                                    <BookOpen className="h-5 w-5 text-muted-foreground"/>
                                    <CardTitle className="text-md font-medium">Moyenne</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                     <p className="text-2xl font-bold">11.5</p>
                                     <p className="text-xs text-muted-foreground">commits par jour</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="languages" className="pt-4">
                         <ChartContainer config={{}} className="h-[350px] w-full -mt-8">
                            <LanguagesChart data={languagesData} />
                         </ChartContainer>
                    </TabsContent>
                    <TabsContent value="contributors" className="pt-4">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Top contributeurs sur ce projet simulé.</p>
                            <ul className="space-y-3">
                                <li className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9"><AvatarFallback>U</AvatarFallback></Avatar>
                                        <div>
                                            <p className="font-semibold">Vous</p>
                                            <p className="text-sm text-muted-foreground">210 commits</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-400">+ 12 commits</p>
                                        <p className="text-xs text-muted-foreground">cette semaine</p>
                                    </div>
                                </li>
                                <li className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9"><AvatarFallback>AD</AvatarFallback></Avatar>
                                        <div>
                                            <p className="font-semibold">Alex Dev</p>
                                            <p className="text-sm text-muted-foreground">85 commits</p>
                                        </div>
                                    </div>
                                     <div className="text-right">
                                        <p className="font-semibold text-green-400">+ 5 commits</p>
                                        <p className="text-xs text-muted-foreground">cette semaine</p>
                                    </div>
                                </li>
                                <li className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9"><AvatarFallback>SC</AvatarFallback></Avatar>
                                        <div>
                                            <p className="font-semibold">Sarah Code</p>
                                            <p className="text-sm text-muted-foreground">52 commits</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-destructive">- 2 commits</p>
                                        <p className="text-xs text-muted-foreground">cette semaine</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </TabsContent>
                </Tabs>
              </CardContent>
          </Card>

      </div>
    </main>
  );
}

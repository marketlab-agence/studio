
'use client';

import { Award, BookOpen, ChevronRight, LayoutGrid, GitCommitHorizontal, Target, TrendingUp, History, Star, Check, Sparkles, Handshake, KanbanSquare, Rocket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useTutorial } from '@/contexts/TutorialContext';
import { StatisticsChart } from '@/components/visualizations/StatisticsChart';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
import type { CourseInfo } from '@/types/course.types';
import type { Quiz } from '@/types/tutorial.types';
import type { Tutorial } from '@/types/tutorial.types';

// Helper function to extract number from chapter title
const getChapterNumber = (title: string) => {
  const match = title.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
};

const courseIcons: Record<string, React.ElementType> = {
  'git-github-tutorial': GitCommitHorizontal,
  'le-closing-pour-debutants-de-prospect-a-client': Handshake,
  'introduction-au-marketing-digital': Sparkles,
  'jira-de-zero-a-heros': KanbanSquare,
  'automatisation-de-processus-informatique-pour-debutants-avec-n8n': Rocket,
};


export default function DashboardPage() {
    const { user, loading: authLoading, isPremium } = useAuth();
    const router = useRouter();
    const { 
        globalProgress,
        setActiveCourse, 
        setCurrentLocation,
        showQuizForChapter,
        overallProgress, 
        totalCompleted, 
        totalLessons, 
        resetActiveCourseProgress, 
        averageQuizScore, 
        masteryIndex,
        activeCourseId
    } = useTutorial();
    
    const [isMounted, setIsMounted] = useState(false);
    const [commitData, setCommitData] = useState<{name: string, commits: number}[]>([]);
    const [languagesData, setLanguagesData] = useState<any[]>([]);

    const [allCoursesData, setAllCoursesData] = useState<CourseInfo[]>([]);
    const [allTutorialsData, setAllTutorialsData] = useState<Tutorial[]>([]);
    const [allQuizzesData, setAllQuizzesData] = useState<Record<string, Quiz>>({});

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        setIsMounted(true);
        // Mock data
        setCommitData([
            { name: 'Jan', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Fev', commits: Math.floor(Math.random() * 50) + 10 },
            { name: 'Mar', commits: Math.floor(Math.random() * 50) + 10 },
        ]);
        setLanguagesData([
            { name: 'TypeScript', value: 65, fill: 'hsl(var(--chart-1))' },
            { name: 'HTML', value: 20, fill: 'hsl(var(--chart-2))' },
            { name: 'CSS', value: 15, fill: 'hsl(var(--chart-3))' },
        ]);

        // Fetch all data
        const fetchAllData = async () => {
            try {
                const [coursesRes, tutorialsRes, quizzesRes] = await Promise.all([
                    fetch('/api/courses'),
                    fetch('/api/tutorials'),
                    fetch('/api/quizzes'),
                ]);
                if (coursesRes.ok) setAllCoursesData(await coursesRes.json());
                if (tutorialsRes.ok) setAllTutorialsData(await tutorialsRes.json());
                if (quizzesRes.ok) setAllQuizzesData(await quizzesRes.json());
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };
        fetchAllData();
    }, []);

    const startedCourses = useMemo(() => {
        if (!globalProgress || allCoursesData.length === 0) return [];
        return allCoursesData.filter(course => {
            const progress = globalProgress[course.id];
            return progress && (progress.completedLessons.size > 0 || progress.currentLessonId) && course.status === 'Publié';
        });
    }, [globalProgress, allCoursesData]);

    const handleContinue = (courseId: string) => {
        const progress = globalProgress[courseId];
        if (!progress) return;

        const chapters = allTutorialsData
            .filter(t => t.courseId === courseId)
            .sort((a, b) => getChapterNumber(a.title) - getChapterNumber(b.title));

        if (chapters.length === 0) return;
        
        const firstChapter = chapters[0];
        const firstChapterQuiz = allQuizzesData[firstChapter.id];
        const firstChapterQuizScore = progress.quizScores[firstChapter.id] ?? 0;

        if (!isPremium && firstChapterQuiz && firstChapterQuizScore >= firstChapterQuiz.passingScore) {
            setActiveCourse(courseId);
            showQuizForChapter(firstChapter.id);
            router.push(`/tutorial/${courseId}`);
            return;
        }

        const lastKnownChapterId = progress.currentChapterId || chapters[0]?.id;
        const lastKnownLessonId = progress.currentLessonId || chapters[0]?.lessons[0]?.id;

        if (lastKnownChapterId && lastKnownLessonId) {
            setActiveCourse(courseId);
            setCurrentLocation(lastKnownChapterId, lastKnownLessonId);
            router.push(`/tutorial/${courseId}`);
        }
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
          
           <div className="space-y-4">
            <h2 className="text-xl font-bold">Formation(s) en cours</h2>
             {startedCourses.length > 0 ? (
                <div className="space-y-4">
                    {startedCourses.map(course => {
                        const courseProgress = globalProgress[course.id];
                        const courseChapters = allTutorialsData
                            .filter(t => t.courseId === course.id)
                            .sort((a, b) => getChapterNumber(a.title) - getChapterNumber(b.title));
                        const totalLessonsForCourse = courseChapters.reduce((acc, chap) => acc + chap.lessons.length, 0);
                        const completedLessonsForCourse = courseProgress?.completedLessons.size || 0;
                        const overallProgressForCourse = totalLessonsForCourse > 0 ? (completedLessonsForCourse / totalLessonsForCourse) * 100 : 0;
                        const Icon = courseIcons[course.id] || Rocket;

                        return (
                            <Card key={course.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 border-primary/20 hover:border-primary/50 transition-colors">
                                <div className="p-4 bg-primary/10 rounded-lg w-fit self-start">
                                    <Icon className="h-10 w-10 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl">{course.title}</CardTitle>
                                    <CardDescription className="mt-2">{course.description}</CardDescription>
                                    <div className="flex items-center gap-4 mt-4">
                                        <Progress value={overallProgressForCourse} className="h-2 flex-1" />
                                        <span className="text-sm font-medium text-muted-foreground">{completedLessonsForCourse} / {totalLessonsForCourse} leçons</span>
                                    </div>
                                </div>
                                <Button onClick={() => handleContinue(course.id)} size="lg" className="w-full md:w-auto self-center md:self-end">
                                    Continuer
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center p-6 text-center border-dashed">
                    <CardTitle className="text-lg">Commencez votre apprentissage !</CardTitle>
                    <CardDescription className="mt-2">Vous n'avez commencé aucune formation.</CardDescription>
                    <Button asChild variant="secondary" className="mt-4">
                        <Link href="/courses">Explorer les formations</Link>
                    </Button>
                </Card>
            )}
          </div>
      </div>
    </main>
  );
}

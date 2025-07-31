
'use client';

import { Award, Lock, Loader2, Trophy, BookOpen } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { CertificateGenerator } from '@/components/specialized/part-10/CertificateGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useRequirePremium } from '@/hooks/useRequirePremium';
import { Skeleton } from '@/components/ui/skeleton';
import { getSettingsAction } from '@/actions/adminActions';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type CourseCompletionData = {
  course: CourseInfo;
  progress: number;
  score: number;
  isComplete: boolean;
  isEligible: boolean;
};

export default function CertificatePage() {
  const { user, loading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const { globalProgress, isLoading: isProgressLoading } = useTutorial();
  useRequirePremium();

  const [instructorName, setInstructorName] = useState('Instructeur Katalyst');
  const [allCourses, setAllCourses] = useState<CourseInfo[]>([]);
  const [allTutorials, setAllTutorials] = useState<Tutorial[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
        setIsDataLoading(true);
        const settings = await getSettingsAction();
        if (settings.instructorName) {
            setInstructorName(settings.instructorName);
        }
        
        try {
            const [coursesRes, tutorialsRes] = await Promise.all([
                fetch('/api/courses'),
                fetch('/api/tutorials')
            ]);

            if (coursesRes.ok) setAllCourses((await coursesRes.json()).filter((c: CourseInfo) => c.status === 'Publié'));
            if (tutorialsRes.ok) setAllTutorials(await tutorialsRes.json());

        } catch (error) {
            console.error("Failed to fetch course data:", error);
        } finally {
            setIsDataLoading(false);
        }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/certificate');
    }
  }, [user, authLoading, router]);

  const completionData = useMemo((): CourseCompletionData[] => {
    if (isDataLoading || isProgressLoading) return [];

    return allCourses.map(course => {
        const progressData = globalProgress[course.id];
        if (!progressData) {
            return { course, progress: 0, score: 0, isComplete: false, isEligible: false };
        }

        const courseTutorials = allTutorials.filter(t => t.courseId === course.id);
        const totalLessons = courseTutorials.reduce((acc, t) => acc + t.lessons.length, 0);
        const completedLessons = progressData.completedLessons.size;
        
        const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        
        const attemptedQuizIds = Object.keys(progressData.quizScores);
        const totalScore = attemptedQuizIds.reduce((acc, quizId) => acc + (progressData.quizScores[quizId] || 0), 0);
        const averageQuizScore = attemptedQuizIds.length > 0 ? totalScore / attemptedQuizIds.length : 0;

        const isComplete = overallProgress >= 100;
        const isEligible = isComplete && averageQuizScore >= 80;

        return {
            course,
            progress: overallProgress,
            score: averageQuizScore,
            isComplete,
            isEligible,
        };
    }).filter(data => data.progress > 0 || data.score > 0);
  }, [allCourses, allTutorials, globalProgress, isDataLoading, isProgressLoading]);

  const eligibleCourses = completionData.filter(c => c.isEligible);
  const inProgressCourses = completionData.filter(c => !c.isEligible);

  const isLoading = authLoading || isProgressLoading || isDataLoading;

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-8 w-3/4"/></CardHeader><CardContent><Skeleton className="h-24 w-full"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-1/2"/></CardHeader><CardContent><Skeleton className="h-32 w-full"/></CardContent></Card>
            </div>
        )
    }

    if (!isPremium) {
      return <Skeleton className="h-64 w-full" />;
    }

    if (eligibleCourses.length === 0 && inProgressCourses.length === 0) {
        return (
            <Card className="text-center py-8">
                <CardHeader>
                    <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-4">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle>Commencez une formation !</CardTitle>
                    <CardDescription>
                        Vous n'avez pas encore commencé de formation. Explorez notre catalogue pour débloquer votre premier certificat.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/courses">Explorer les formations</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {eligibleCourses.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-400"/> Formations terminées</CardTitle>
                        <CardDescription>Félicitations ! Vous pouvez générer un certificat pour ces formations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {eligibleCourses.map(data => (
                                <AccordionItem value={data.course.id} key={data.course.id}>
                                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">{data.course.title}</AccordionTrigger>
                                    <AccordionContent>
                                        <CertificateGenerator courseTitle={data.course.title} averageQuizScore={data.score} masteryIndex={0} instructorName={instructorName} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}

            {inProgressCourses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Formations en cours</CardTitle>
                        <CardDescription>Terminez ces formations et obtenez un score suffisant pour débloquer votre certificat.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {inProgressCourses.map(data => (
                           <div key={data.course.id} className="p-4 border rounded-lg">
                                <h3 className="font-semibold">{data.course.title}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-sm">
                                    <div>
                                        <p className="font-medium mb-1">Progression</p>
                                        <Progress value={data.progress} />
                                        <p className="text-xs text-muted-foreground mt-1">{Math.round(data.progress)}%</p>
                                    </div>
                                    <div>
                                        <p className="font-medium mb-1">Score moyen aux quiz</p>
                                        <p className={`font-bold ${data.score < 80 ? 'text-destructive' : 'text-green-500'}`}>
                                            {data.score.toFixed(0)}% <span className="text-xs font-normal text-muted-foreground">(Objectif: 80%)</span>
                                        </p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="mt-4" asChild>
                                    <Link href={`/dashboard`}>Continuer la formation</Link>
                                </Button>
                           </div>
                       ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vos Certificats de Réussite</h1>
            <p className="text-muted-foreground">Validez la complétion de votre apprentissage pour chaque formation.</p>
          </div>
        </div>
        {renderContent()}
      </div>
    </main>
  );
}

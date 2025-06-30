
'use client';

import { Award, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTutorial } from '@/contexts/TutorialContext';
import { CertificateGenerator } from '@/components/specialized/part-10/CertificateGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { TUTORIALS } from '@/lib/tutorials';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useRequirePremium } from '@/hooks/useRequirePremium';
import { Skeleton } from '@/components/ui/skeleton';

export default function CertificatePage() {
  const { user, loading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const { setActiveCourse, overallProgress, progress, setCurrentLocation, averageQuizScore, masteryIndex, courseChapters } = useTutorial();
  const [isMounted, setIsMounted] = useState(false);

  useRequirePremium();

  useEffect(() => {
    setIsMounted(true);
    // Hardcode to git course for now, this page should be dynamic later
    setActiveCourse('git-github-tutorial');
  }, [setActiveCourse]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/certificate');
    }
  }, [user, authLoading, router]);


  const handleContinue = () => {
    if (!courseChapters) return;
    
    // Start searching from the user's last known chapter.
    let startChapterIndex = progress.currentChapterId 
        ? courseChapters.findIndex(c => c.id === progress.currentChapterId) 
        : 0;

    if (startChapterIndex === -1) {
        // Fallback if currentChapterId is invalid for some reason
        startChapterIndex = 0;
    }
    
    // Create a reordered list of chapters to search, starting from the current one and wrapping around.
    const chaptersToSearch = [...courseChapters.slice(startChapterIndex), ...courseChapters.slice(0, startChapterIndex)];
    
    let nextLesson = null;
    let chapterOfNextLesson = null;

    for (const chapter of chaptersToSearch) {
      // Find the first uncompleted lesson in this chapter
      const lesson = chapter.lessons.find(l => !progress.completedLessons.has(l.id));
      if (lesson) {
          nextLesson = lesson;
          chapterOfNextLesson = chapter;
          break; // Found the first uncompleted lesson, stop searching.
      }
    }
    
    if (nextLesson && chapterOfNextLesson) {
        setCurrentLocation(chapterOfNextLesson.id, nextLesson.id);
        router.push(`/tutorial/${chapterOfNextLesson.courseId}`)
    } else if (progress.currentChapterId && progress.currentLessonId) {
      // Fallback to last known position if for some reason we can't find the next one
      setCurrentLocation(progress.currentChapterId, progress.currentLessonId);
    }
  };

  const isTutorialComplete = overallProgress >= 100;
  const isScoreSufficient = averageQuizScore >= 80;

  const renderContent = () => {
    if (!isMounted || authLoading || !user || !isPremium) {
      return (
        <Card className="text-center py-8">
          <CardHeader>
            <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <CardTitle>Vérification de l'accès</CardTitle>
            <CardDescription>
              Nous vérifions votre statut d'abonnement...
            </CardDescription>
          </CardHeader>
          <CardContent className="max-w-sm mx-auto space-y-4">
             <Skeleton className="h-4 w-32 mx-auto" />
             <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      );
    }

    if (isTutorialComplete && isScoreSufficient) {
      return <CertificateGenerator averageQuizScore={averageQuizScore} masteryIndex={masteryIndex} />;
    }

    if (!isTutorialComplete) {
        return (
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
              <Button onClick={handleContinue}>Continuer le Tutoriel</Button>
            </CardContent>
          </Card>
        );
    }
    
    // Case: tutorial complete but score not sufficient
    return (
        <Card className="text-center py-8">
            <CardHeader>
                <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>Certificat Presque Débloqué</CardTitle>
                <CardDescription>
                Vous devez obtenir un score moyen d'au moins 80% aux quiz pour générer votre certificat.
                </CardDescription>
            </CardHeader>
            <CardContent className="max-w-sm mx-auto space-y-4">
                <div>
                <p className="text-sm font-medium mb-2">Votre score moyen actuel :</p>
                <div className="text-4xl font-bold text-destructive">{averageQuizScore.toFixed(0)}%</div>
                <p className="text-sm text-muted-foreground mt-2">Objectif : 80%</p>
                </div>
                <Button asChild>
                <Link href="/dashboard">Améliorer mon score</Link>
                </Button>
            </CardContent>
        </Card>
    );
  };

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

        {renderContent()}
      </div>
    </main>
  );
}

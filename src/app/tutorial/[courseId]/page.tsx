
'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TutorialPanel } from '@/components/tutorial-panel';
import { LessonView } from '@/components/tutorial/LessonView';
import { QuizView } from '@/components/tutorial/QuizView';
import { NavigationControls } from '@/components/tutorial/NavigationControls';
import { useTutorial } from '@/contexts/TutorialContext';
import { QUIZZES } from '@/lib/quiz';
import { TUTORIALS } from '@/lib/tutorials';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { COURSES } from '@/lib/courses';
import { notFound } from 'next/navigation';

export default function TutorialCoursePage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const { courseId } = params;

  const {
    progress,
    currentChapter,
    currentLesson,
    setQuizScore,
    setCurrentLocation,
    showQuizForChapter,
    currentView,
    setActiveCourse,
    course,
    courseChapters
  } = useTutorial();

  const courseExists = useMemo(() => COURSES.some(c => c.id === courseId), [courseId]);

  useEffect(() => {
    if (courseId && courseExists) {
        setActiveCourse(courseId);
    }
  }, [courseId, setActiveCourse, courseExists]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const chapterQuiz = useMemo(() => currentChapter ? QUIZZES[currentChapter.id] : undefined, [currentChapter]);
  
  const isLastLessonInChapter = currentLesson && currentChapter ? currentChapter.lessons[currentChapter.lessons.length - 1].id === currentLesson.id : false;
  const isQuizAvailable = !!chapterQuiz;

  const handleQuizComplete = useCallback((score: number, answers: Record<string, string[]>) => {
    if (currentChapter) {
      setQuizScore(currentChapter.id, score, answers);
    }
  }, [currentChapter, setQuizScore]);
  
  const handleStartQuiz = () => {
    if (currentChapter) {
      showQuizForChapter(currentChapter.id);
    }
  }

  const handleFinishQuiz = useCallback(() => {
    if (!currentChapter) return;

    const score = progress.quizScores[currentChapter.id] ?? 0;
    const quiz = QUIZZES[currentChapter.id];
    const passed = score >= (quiz?.passingScore ?? 80);

    if (passed) {
      let nextUncompletedChapter = null;
      let nextUncompletedLesson = null;

      for (const chapter of courseChapters) {
        const lesson = chapter.lessons.find(
          (l) => !progress.completedLessons.has(l.id)
        );
        if (lesson) {
          nextUncompletedChapter = chapter;
          nextUncompletedLesson = lesson;
          break; 
        }
      }

      if (nextUncompletedChapter && nextUncompletedLesson) {
        setCurrentLocation(
          nextUncompletedChapter.id,
          nextUncompletedLesson.id
        );
      } else {
        router.push('/certificate');
      }
    } else {
      setCurrentLocation(currentChapter.id, currentChapter.lessons[0].id);
    }
  }, [currentChapter, progress.quizScores, progress.completedLessons, setCurrentLocation, router, courseChapters]);
  
  if (!courseExists) {
    notFound();
  }

  const skeletonView = (
    <div className="flex flex-col h-full">
       <div className="flex-1 p-6 md:p-8 overflow-y-auto">
           <Skeleton className="h-6 w-1/4 mb-2" />
           <Skeleton className="h-10 w-3/4 mb-4" />
           <Skeleton className="h-6 w-full mb-8" />
           <Skeleton className="h-4 w-full mb-4" />
           <Skeleton className="h-4 w-full mb-4" />
           <Skeleton className="h-4 w-5/6 mb-4" />
       </div>
        <div className="flex justify-between items-center p-4 border-t bg-card">
           <Skeleton className="h-9 w-28" />
           <Skeleton className="h-9 w-36" />
       </div>
   </div>
 );

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] gap-6 p-4 md:p-6">
      <aside className="hidden md:flex md:flex-col">
        {isMounted && course && courseChapters ? (
            <TutorialPanel course={course} chapters={courseChapters} />
        ): (
            <div className="p-2 space-y-1">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-card rounded-lg border">
        
        {!isMounted || authLoading || !user ? (
            skeletonView
        ) : (
          <>
            <div className={cn("flex flex-col h-full", currentView !== 'lesson' && 'hidden')}>
                {currentLesson && currentChapter ? (
                    <>
                        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                            <LessonView lesson={currentLesson} />
                        </div>
                        <NavigationControls onTakeQuiz={isLastLessonInChapter && isQuizAvailable ? handleStartQuiz : undefined} />
                    </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                      <BookOpen className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Bienvenue dans le tutoriel interactif</h2>
                    <p className="max-w-md text-muted-foreground mb-6">
                      Sélectionnez un chapitre dans le panneau de gauche, ou cliquez sur le bouton ci-dessous pour démarrer avec la première leçon.
                    </p>
                    <Button size="lg" onClick={() => setCurrentLocation(courseChapters[0].id, courseChapters[0].lessons[0].id)}>
                        Commencer le tutoriel
                    </Button>
                  </div>
                )}
            </div>

            <div className={cn("h-full", currentView !== 'quiz' && 'hidden')}>
                {chapterQuiz && <QuizView quiz={chapterQuiz} onQuizComplete={handleQuizComplete} onFinishQuiz={handleFinishQuiz} />}
            </div>
          </>
        )}

      </main>
    </div>
  );
}

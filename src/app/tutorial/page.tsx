'use client';

import { useMemo, useCallback } from 'react';
import { TutorialPanel } from '@/components/tutorial-panel';
import { LessonView } from '@/components/tutorial/LessonView';
import { QuizView } from '@/components/tutorial/QuizView';
import { NavigationControls } from '@/components/tutorial/NavigationControls';
import { useTutorial } from '@/contexts/TutorialContext';
import { QUIZZES } from '@/lib/quiz';
import { TUTORIALS } from '@/lib/tutorials';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

export default function TutorialPage() {
  const {
    progress,
    currentChapter,
    currentLesson,
    setQuizScore,
    setCurrentLocation,
    showQuizForChapter,
    currentView
  } = useTutorial();

  const chapterQuiz = useMemo(() => currentChapter ? QUIZZES[currentChapter.id] : undefined, [currentChapter]);
  
  const isLastLessonInChapter = currentLesson && currentChapter ? currentChapter.lessons[currentChapter.lessons.length - 1].id === currentLesson.id : false;
  const isQuizAvailable = !!chapterQuiz;

  const handleQuizComplete = useCallback((score: number) => {
    if (currentChapter) {
      setQuizScore(currentChapter.id, score);
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
        const chapterIndex = TUTORIALS.findIndex(c => c.id === currentChapter.id);
        const isLastChapter = chapterIndex === TUTORIALS.length - 1;

        if (!isLastChapter) {
            const nextChapter = TUTORIALS[chapterIndex + 1];
            setCurrentLocation(nextChapter.id, nextChapter.lessons[0].id);
        } else {
            setCurrentLocation(currentChapter.id, currentChapter.lessons[0].id);
        }
    } else {
        // User failed and clicked "Réviser le chapitre"
        setCurrentLocation(currentChapter.id, currentChapter.lessons[0].id);
    }
  }, [currentChapter, setCurrentLocation, progress.quizScores]);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] gap-6 p-4 md:p-6">
      <aside className="hidden md:flex md:flex-col">
        <TutorialPanel />
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-card rounded-lg border">
        
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
                <Button size="lg" onClick={() => setCurrentLocation(TUTORIALS[0].id, TUTORIALS[0].lessons[0].id)}>
                    Commencer le tutoriel
                </Button>
              </div>
            )}
        </div>

        <div className={cn("h-full", currentView !== 'quiz' && 'hidden')}>
             {chapterQuiz && <QuizView quiz={chapterQuiz} onQuizComplete={handleQuizComplete} onFinishQuiz={handleFinishQuiz} />}
        </div>

      </main>
    </div>
  );
}

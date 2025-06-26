'use client';

import { useState, useMemo, useCallback } from 'react';
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
    setCurrentLocation
  } = useTutorial();

  const [viewMode, setViewMode] = useState<'lesson' | 'quiz'>('lesson');

  const chapterQuiz = useMemo(() => currentChapter ? QUIZZES[currentChapter.id] : undefined, [currentChapter]);
  
  const isLastLessonInChapter = currentLesson && currentChapter ? currentChapter.lessons[currentChapter.lessons.length - 1].id === currentLesson.id : false;
  const isQuizAvailable = !!chapterQuiz;

  const handleQuizComplete = useCallback((score: number) => {
    if (currentChapter) {
      setQuizScore(currentChapter.id, score);
    }
  }, [currentChapter, setQuizScore]);
  
  const handleStartQuiz = () => {
    setViewMode('quiz');
  }

  const handleFinishQuiz = useCallback(() => {
    const score = (currentChapter && progress.quizScores[currentChapter.id])
      ? progress.quizScores[currentChapter.id]
      : 0;

    const quiz = currentChapter ? QUIZZES[currentChapter.id] : undefined;
    const passingScore = quiz ? quiz.passingScore : 80;
    
    const passed = score >= passingScore;

    if (passed) {
        const chapterIndex = TUTORIALS.findIndex(c => c.id === currentChapter?.id);
        if (chapterIndex !== -1 && chapterIndex < TUTORIALS.length - 1) {
            const nextChapter = TUTORIALS[chapterIndex + 1];
            setCurrentLocation(nextChapter.id, nextChapter.lessons[0].id);
        }
    }
    setViewMode('lesson');
  }, [currentChapter, progress.quizScores, setCurrentLocation]);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] gap-6 p-4 md:p-6">
      <aside className="hidden md:flex md:flex-col">
        <TutorialPanel />
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-card rounded-lg border">
        
        <div className={cn("flex flex-col h-full", viewMode !== 'lesson' && 'hidden')}>
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

        <div className={cn("h-full", viewMode !== 'quiz' && 'hidden')}>
             {chapterQuiz && <QuizView quiz={chapterQuiz} onQuizComplete={handleQuizComplete} onFinishQuiz={handleFinishQuiz} />}
        </div>

      </main>
    </div>
  );
}

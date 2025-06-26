'use client';

import { useState, useEffect, useMemo } from 'react';
import { TutorialPanel } from '@/components/tutorial-panel';
import { LessonView } from '@/components/tutorial/LessonView';
import { QuizView } from '@/components/tutorial/QuizView';
import { NavigationControls } from '@/components/tutorial/NavigationControls';
import { useTutorial } from '@/contexts/TutorialContext';
import { QUIZZES } from '@/lib/quiz';
import { TUTORIALS } from '@/lib/tutorials';
import { cn } from '@/lib/utils';

export default function TutorialPage() {
  const {
    progress,
    currentChapter,
    currentLesson,
    setQuizScore,
    setCurrentLocation
  } = useTutorial();

  const [viewMode, setViewMode] = useState<'lesson' | 'quiz'>('lesson');

  useEffect(() => {
    // Reset to lesson view when lesson changes, but not if we're in a quiz
    if (viewMode !== 'quiz') {
      setViewMode('lesson');
    }
  }, [currentLesson, viewMode]);

  const chapterQuiz = useMemo(() => currentChapter ? QUIZZES[currentChapter.id] : undefined, [currentChapter]);
  
  const isLastLessonInChapter = currentLesson && currentChapter ? currentChapter.lessons[currentChapter.lessons.length - 1].id === currentLesson.id : false;
  const isQuizAvailable = !!chapterQuiz;

  const handleQuizComplete = (score: number) => {
    if (currentChapter) {
      setQuizScore(currentChapter.id, score);
    }
  };
  
  const handleStartQuiz = () => {
    setViewMode('quiz');
  }

  const handleFinishQuiz = () => {
    const score = (currentChapter && progress.quizScores[currentChapter.id])
      ? progress.quizScores[currentChapter.id]
      : 0;

    const quiz = currentChapter ? QUIZZES[currentChapter.id] : undefined;
    const passingScore = quiz ? quiz.passingScore : 80;
    
    const passed = score >= passingScore;

    if (passed) {
        const chapterIndex = TUTORIALS.findIndex(c => c.id === currentChapter?.id);
        // If there is a next chapter, move to it
        if (chapterIndex !== -1 && chapterIndex < TUTORIALS.length - 1) {
            const nextChapter = TUTORIALS[chapterIndex + 1];
            setCurrentLocation(nextChapter.id, nextChapter.lessons[0].id);
        }
    }
    // In all cases (passed and go next, passed and no next, or failed and review), we return to lesson view
    setViewMode('lesson');
  }


  return (
    <div className="flex h-screen w-full bg-background font-sans">
      <aside className="w-[450px] min-w-[350px] max-w-[500px] border-r border-border flex-shrink-0">
        <TutorialPanel />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        
        <div className={cn("flex flex-col h-full", viewMode !== 'lesson' && 'hidden')}>
            {currentLesson && currentChapter ? (
                <>
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                        <LessonView lesson={currentLesson} />
                    </div>
                    <NavigationControls onTakeQuiz={isLastLessonInChapter && isQuizAvailable ? handleStartQuiz : undefined} />
                </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">Veuillez sélectionner une leçon pour commencer.</div>
            )}
        </div>

        <div className={cn("h-full", viewMode !== 'quiz' && 'hidden')}>
             {chapterQuiz && <QuizView quiz={chapterQuiz} onQuizComplete={handleQuizComplete} onFinishQuiz={handleFinishQuiz} />}
        </div>

      </main>
    </div>
  );
}

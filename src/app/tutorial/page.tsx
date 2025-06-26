'use client';

import { useState, useEffect } from 'react';
import { TutorialPanel } from '@/components/tutorial-panel';
import { Terminal } from '@/components/terminal';
import { LessonView } from '@/components/tutorial/LessonView';
import { QuizView } from '@/components/tutorial/QuizView';
import { NavigationControls } from '@/components/tutorial/NavigationControls';
import { useTutorial } from '@/contexts/TutorialContext';
import { QUIZZES } from '@/lib/quiz';
import { TUTORIALS } from '@/lib/tutorials';

export default function TutorialPage() {
  const { 
    currentChapter, 
    currentLesson, 
    progress, 
    setQuizScore 
  } = useTutorial();
  
  const [viewMode, setViewMode] = useState<'lesson' | 'quiz'>('lesson');

  useEffect(() => {
    // Reset to lesson view when lesson changes
    setViewMode('lesson');
  }, [currentLesson]);
  
  const chapterQuiz = currentChapter ? QUIZZES[currentChapter.id] : undefined;

  const handleQuizComplete = (score: number) => {
    if (currentChapter) {
      setQuizScore(currentChapter.id, score);
    }
  };

  const handleStartQuiz = () => {
    setViewMode('quiz');
  }

  const terminalContext = currentLesson?.title || "Bienvenue dans le tutoriel interactif !";
  const initialCommand = currentLesson?.command;

  const RightPanelContent = () => {
    if (viewMode === 'quiz' && chapterQuiz) {
        return <QuizView quiz={chapterQuiz} onQuizComplete={handleQuizComplete} />;
    }
    
    if (currentLesson && currentChapter) {
        const isLastLesson = currentChapter.lessons[currentChapter.lessons.length - 1].id === currentLesson.id;
        const isQuizAvailable = !!chapterQuiz;

      return (
        <div className="grid grid-rows-2 h-full min-h-0">
          <div className="row-span-1 overflow-y-auto flex flex-col">
            <div className="flex-1 p-6 md:p-8">
                <LessonView lesson={currentLesson} />
            </div>
            <NavigationControls onTakeQuiz={isLastLesson && isQuizAvailable ? handleStartQuiz : undefined} />
          </div>
          <div className="row-span-1 border-t">
            <Terminal context={terminalContext} initialCommand={initialCommand} key={currentLesson?.id} />
          </div>
        </div>
      );
    }
    
    return <div className="p-8 text-center text-muted-foreground">Veuillez sélectionner une leçon pour commencer.</div>;
  };

  return (
    <div className="flex h-screen w-full bg-background font-sans">
      <aside className="w-[450px] min-w-[350px] max-w-[500px] border-r border-border flex-shrink-0">
        <TutorialPanel />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <RightPanelContent />
      </main>
    </div>
  );
}

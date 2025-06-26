'use client';

import { useState, useEffect } from 'react';
import { TUTORIALS } from '@/lib/tutorials';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Circle, Lock, ChevronRight, GraduationCap } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { QUIZZES } from '@/lib/quiz';

export function TutorialPanel() {
  const {
    progress,
    setCurrentLocation,
    currentChapter,
    currentLesson,
    overallProgress,
    showQuizForChapter,
  } = useTutorial();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLessonClick = (chapterId: string, lessonId: string) => {
    setCurrentLocation(chapterId, lessonId);
  };
  
  const handleQuizClick = (chapterId: string) => {
    showQuizForChapter(chapterId);
  };

  const defaultAccordionValue = isMounted && currentChapter ? [currentChapter.id] : [];

  return (
    <aside className="hidden md:flex md:flex-col bg-card/50 border-0 md:border md:rounded-lg">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Tutoriel GitHub</h2>
        <p className="text-sm text-muted-foreground">Votre guide interactif</p>
      </div>

      <div className="p-4 border-b">
        <p className="text-sm font-medium mb-2">Progression Globale</p>
        {isMounted ? (
          <>
            <Progress value={overallProgress} />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {Math.round(overallProgress)}% complété
            </p>
          </>
        ) : (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20 mt-2 ml-auto" />
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isMounted ? (
          <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full p-2">
            {TUTORIALS.map((tutorial, index) => {
              const isFirstChapter = index === 0;
              const prevChapter = isFirstChapter ? null : TUTORIALS[index - 1];
              const prevChapterQuiz = prevChapter ? QUIZZES[prevChapter.id] : null;
              const quizScorePrevChapter = prevChapter ? progress.quizScores[prevChapter.id] ?? 0 : 0;
              const isLocked = !isFirstChapter && prevChapterQuiz && quizScorePrevChapter < prevChapterQuiz.passingScore;

              const chapterQuiz = QUIZZES[tutorial.id];
              const isCompleted = chapterQuiz && (progress.quizScores?.[tutorial.id] ?? 0) >= chapterQuiz.passingScore;

              return (
                <AccordionItem value={tutorial.id} key={tutorial.id} className="border-b-0" disabled={isLocked}>
                  <AccordionTrigger
                    className={cn(
                      'text-md rounded-md px-2 py-2 font-semibold hover:bg-muted/50 hover:no-underline',
                      isLocked && 'cursor-not-allowed text-muted-foreground/50',
                      !isLocked && currentChapter?.id === tutorial.id && 'text-primary'
                    )}
                  >
                    <div className="flex flex-1 items-center gap-3">
                      {isLocked ? (
                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                      ) : isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="font-bold text-primary">{index + 1}</span>
                      )}
                      <span className="flex-1 text-left">{tutorial.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4">
                    <div className="space-y-1">
                      {tutorial.lessons.map((lesson) => {
                        const isLessonMarkedAsComplete = progress.completedLessons.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            className={cn(
                              'flex w-full items-center justify-between gap-2 rounded-md p-3 text-left text-sm transition-colors',
                              progress.currentView === 'lesson' && lesson.id === currentLesson?.id
                                ? 'bg-primary/10 text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            )}
                            onClick={() => handleLessonClick(tutorial.id, lesson.id)}
                          >
                            <span className="font-medium">{lesson.title}</span>
                            {isLessonMarkedAsComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : lesson.id === currentLesson?.id && progress.currentView === 'lesson' ? (
                              <ChevronRight className="h-4 w-4 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4 text-border" />
                            )}
                          </button>
                        );
                      })}
                       <button
                          key={`${tutorial.id}-quiz`}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-md p-3 text-left text-sm font-semibold transition-colors',
                            progress.currentView === 'quiz' && tutorial.id === currentChapter?.id
                              ? 'bg-primary/10 text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          )}
                          onClick={() => handleQuizClick(tutorial.id)}
                          disabled={isLocked}
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Quiz du Chapitre</span>
                          </div>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : progress.currentView === 'quiz' && tutorial.id === currentChapter?.id ? (
                            <ChevronRight className="h-4 w-4 text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-border" />
                          )}
                        </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="p-2 space-y-1">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

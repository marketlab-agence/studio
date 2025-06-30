
'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';

export function TutorialPanel({ course, chapters }: { course: CourseInfo, chapters: Tutorial[] }) {
  const {
    progress,
    setCurrentLocation,
    currentChapter,
    currentLesson,
    overallProgress,
    showQuizForChapter,
    areAllLessonsInChapterCompleted,
  } = useTutorial();
  const { isPremium } = useAuth();
  const router = useRouter();

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
        <h2 className="text-lg font-semibold">{course.title}</h2>
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
            {chapters.map((tutorial, index) => {
              const isFirstChapter = index === 0;
              const prevChapter = isFirstChapter ? null : chapters[index - 1];
              const prevChapterQuiz = prevChapter ? QUIZZES[prevChapter.id] : null;
              const quizScorePrevChapter = prevChapter ? progress.quizScores[prevChapter.id] ?? 0 : 0;
              const isChapterLockedByPreviousQuiz = !isFirstChapter && prevChapterQuiz && quizScorePrevChapter < prevChapterQuiz.passingScore;
              
              const isPremiumLocked = index > 0 && !isPremium;
              const isChapterTotallyLocked = isChapterLockedByPreviousQuiz || isPremiumLocked;

              const chapterQuiz = QUIZZES[tutorial.id];
              const isQuizPassed = chapterQuiz && (progress.quizScores?.[tutorial.id] ?? 0) >= chapterQuiz.passingScore;

              const areLessonsCompletedForQuiz = areAllLessonsInChapterCompleted(tutorial.id);

              return (
                <AccordionItem value={tutorial.id} key={tutorial.id} className="border-b-0">
                  <AccordionTrigger
                    className={cn(
                      'text-md rounded-md px-2 py-2 font-semibold hover:bg-muted/50 hover:no-underline',
                      isChapterTotallyLocked && 'cursor-not-allowed text-muted-foreground/50',
                      !isChapterTotallyLocked && currentChapter?.id === tutorial.id && 'text-primary'
                    )}
                    disabled={isChapterTotallyLocked}
                  >
                    <div className="flex flex-1 items-center gap-3">
                      {isChapterTotallyLocked ? (
                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                      ) : isQuizPassed ? (
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
                              !isChapterTotallyLocked && progress.currentView === 'lesson' && lesson.id === currentLesson?.id
                                ? 'bg-primary/10 text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                isChapterTotallyLocked && 'cursor-not-allowed text-muted-foreground/50 hover:bg-transparent'
                            )}
                             onClick={() => {
                              if (isChapterTotallyLocked) {
                                router.push('/pricing');
                              } else {
                                handleLessonClick(tutorial.id, lesson.id);
                              }
                            }}
                            disabled={isChapterTotallyLocked}
                          >
                            <span className="font-medium">{lesson.title}</span>
                            {isChapterTotallyLocked ? (
                              <Lock className="h-4 w-4 text-yellow-500" />
                            ) : isLessonMarkedAsComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : lesson.id === currentLesson?.id && progress.currentView === 'lesson' ? (
                              <ChevronRight className="h-4 w-4 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4 text-border" />
                            )}
                          </button>
                        );
                      })}
                       {chapterQuiz && <button
                          key={`${tutorial.id}-quiz`}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-md p-3 text-left text-sm font-semibold transition-colors',
                            !isChapterTotallyLocked && progress.currentView === 'quiz' && tutorial.id === currentChapter?.id
                              ? 'bg-primary/10 text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                            (isChapterTotallyLocked || !areLessonsCompletedForQuiz) && 'cursor-not-allowed text-muted-foreground/50 hover:bg-transparent'
                          )}
                          onClick={() => {
                              if (isChapterTotallyLocked) {
                                router.push('/pricing');
                              } else if (areLessonsCompletedForQuiz) {
                                handleQuizClick(tutorial.id);
                              }
                          }}
                          disabled={isChapterTotallyLocked || !areLessonsCompletedForQuiz}
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Quiz du Chapitre</span>
                          </div>
                          {(() => {
                            if (isChapterTotallyLocked) return <Lock className="h-4 w-4 text-yellow-500" />;
                            if (!areLessonsCompletedForQuiz) return <Lock className="h-4 w-4" />;
                            if (isQuizPassed) return <CheckCircle className="h-4 w-4 text-green-500" />;
                            if (progress.currentView === 'quiz' && tutorial.id === currentChapter?.id) return <ChevronRight className="h-4 w-4 text-primary" />;
                            return <ChevronRight className="h-4 w-4" />;
                          })()}
                        </button>}
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

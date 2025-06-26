'use client';

import { TUTORIALS } from '@/lib/tutorials';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Circle, Lock } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

export function TutorialPanel() {
  const {
    progress,
    setCurrentLocation,
    currentChapter,
    currentLesson,
    overallProgress,
  } = useTutorial();

  const handleLessonClick = (chapterId: string, lessonId: string) => {
    setCurrentLocation(chapterId, lessonId);
  };

  const defaultAccordionValue = currentChapter ? [currentChapter.id] : [];

  return (
    <Card className="flex h-full flex-col bg-card/50 border-0 md:border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Tutoriel GitHub</h2>
        <p className="text-sm text-muted-foreground">Votre guide interactif</p>
      </div>

      <div className="p-4 border-b">
        <p className="text-sm font-medium mb-2">Progression Globale</p>
        <Progress value={overallProgress} />
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {Math.round(overallProgress)}% complété
        </p>
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full p-2">
          {TUTORIALS.map((tutorial, index) => {
            const isFirstChapter = index === 0;
            const prevChapter = isFirstChapter ? null : TUTORIALS[index-1];
            const quizScorePrevChapter = prevChapter ? progress.quizScores[prevChapter.id] ?? 0 : 0;
            const isLocked = !isFirstChapter && quizScorePrevChapter < 80;
            const isCompleted = (progress.quizScores?.[tutorial.id] ?? 0) >= 80;
            
            return (
              <AccordionItem value={tutorial.id} key={tutorial.id} className="border-b-0" disabled={isLocked}>
                <AccordionTrigger className={cn(
                  "text-md rounded-md px-2 py-2 font-semibold hover:bg-muted/50 hover:no-underline",
                  isLocked && "text-muted-foreground/50 cursor-not-allowed"
                )}>
                  <div className="flex items-center gap-3 flex-1">
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
                    {tutorial.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-md p-3 text-left text-sm transition-colors',
                          lesson.id === currentLesson?.id
                            ? 'bg-primary/10 text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                        onClick={() => handleLessonClick(tutorial.id, lesson.id)}
                      >
                        <span className="font-medium">{lesson.title}</span>
                        {progress.completedLessons.has(lesson.id) ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-border" />
                        )}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </Card>
  );
}

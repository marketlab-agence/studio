'use client';

import { TUTORIALS } from '@/lib/tutorials';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Rocket, BookOpen, GitCommitHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useTutorial } from '@/contexts/TutorialContext';
import { cn } from '@/lib/utils';

export function TutorialPanel() {
  const {
    progress,
    setCurrentLocation,
    currentChapter,
    currentLesson,
    overallProgress,
    totalCompleted,
    totalLessons,
  } = useTutorial();


  const handleLessonClick = (chapterId: string, lessonId: string) => {
    setCurrentLocation(chapterId, lessonId);
  };

  const defaultAccordionValue = currentChapter ? [currentChapter.id] : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-border p-4">
        <Link href="/" className="flex items-center gap-2 group">
          <GitCommitHorizontal className="h-7 w-7 text-primary transition-transform group-hover:rotate-12" />
          <h1 className="text-xl font-bold tracking-tight text-foreground/80 transition-colors group-hover:text-foreground">
            Git & GitHub Interactif
          </h1>
        </Link>
      </div>

      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Votre Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Progress value={overallProgress} className="w-full" />
            <span className="text-sm font-medium text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {totalCompleted} sur {totalLessons} leçons terminées. Continuez comme ça !
          </p>
        </CardContent>
      </Card>

      <div className="flex-1 flex flex-col overflow-hidden">
        <h2 className="px-4 text-lg font-semibold flex items-center gap-2 mb-2"><BookOpen className="w-5 h-5"/>Tutoriels</h2>
        <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full px-4">
              {TUTORIALS.map((tutorial) => (
                <AccordionItem value={tutorial.id} key={tutorial.id}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    {tutorial.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-4">{tutorial.description}</p>
                    <div className="space-y-1">
                      {tutorial.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          className={cn(
                              'flex w-full items-center justify-between gap-2 rounded-md p-3 text-left transition-colors',
                              lesson.id === currentLesson?.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
                          )}
                          onClick={() => handleLessonClick(tutorial.id, lesson.id)}
                        >
                            <span className="font-medium">{lesson.title}</span>
                            {progress.completedLessons.has(lesson.id) && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
        </ScrollArea>
      </div>
    </div>
  );
}

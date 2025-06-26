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
import { CheckCircle, Circle, BookCopy, ChevronRight, Activity, FlaskConical, GraduationCap } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

const sectionIcons: Record<string, React.ElementType> = {
  'parcours': BookCopy,
  'activites': FlaskConical,
  'validation': GraduationCap
};

const sections = {
  'parcours': {
    title: "Parcours d'Apprentissage",
    items: TUTORIALS,
    icon: BookCopy,
  },
  'activites': {
    title: "Activités Interactives",
    items: [
      // Placeholder for future activities
      { id: 'sim-1', title: "Simulateur de Conflits", upcoming: true },
      { id: 'sim-2', title: "Jeu de Branches", upcoming: true },
    ],
    icon: FlaskConical
  },
  'validation': {
    title: "Validation & Feedback",
    items: [
      // Placeholder for future items
      { id: 'val-1', title: "Quiz Finaux", upcoming: true },
      { id: 'val-2', title: "Certificat", upcoming: true },
    ],
    icon: GraduationCap
  }
};

export function TutorialPanel() {
  const {
    progress,
    setCurrentLocation,
    currentChapter,
    currentLesson,
    overallProgress
  } = useTutorial();

  const handleLessonClick = (chapterId: string, lessonId: string) => {
    setCurrentLocation(chapterId, lessonId);
  };

  const defaultAccordionValue = currentChapter ? [`parcours-${currentChapter.id}`] : [];

  return (
    <Card className="flex h-full flex-col bg-card/50 border-0 md:border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Tutoriel GitHub</h2>
        <p className="text-sm text-muted-foreground">Votre guide interactif</p>
      </div>

      <div className="p-4 border-b">
         <p className="text-sm font-medium mb-2">Progression Globale</p>
         <Progress value={overallProgress} />
         <p className="text-xs text-muted-foreground mt-2 text-right">{Math.round(overallProgress)}% complété</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
            <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full">
              {Object.entries(sections).map(([key, section]) => (
                <div key={key} className="mb-4 rounded-lg bg-muted/30 p-2">
                  <h3 className="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-muted-foreground">
                    <section.icon className="h-4 w-4" />
                    {section.title}
                  </h3>
                   {key === 'parcours' ? (
                     <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full">
                        {TUTORIALS.map((tutorial) => (
                            <AccordionItem value={`parcours-${tutorial.id}`} key={tutorial.id} className="border-b-0">
                                <AccordionTrigger className="text-md rounded-md px-2 py-2 font-semibold hover:bg-muted/50 hover:no-underline">
                                    {tutorial.title}
                                </AccordionTrigger>
                                <AccordionContent className="pl-4">
                                    <div className="space-y-1">
                                    {tutorial.lessons.map((lesson) => (
                                        <button
                                        key={lesson.id}
                                        className={cn(
                                            'flex w-full items-center justify-between gap-2 rounded-md p-3 text-left text-sm transition-colors',
                                            lesson.id === currentLesson?.id ? 'bg-primary/10 text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
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
                        ))}
                     </Accordion>
                   ) : (
                     <div className="mt-2 space-y-1 p-2">
                        {section.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between rounded-md p-3 text-sm text-muted-foreground/50">
                               <span>{item.title}</span>
                               <span className="text-xs font-bold">À VENIR</span>
                            </div>
                        ))}
                     </div>
                   )}
                </div>
              ))}
            </Accordion>
        </div>
      </ScrollArea>
    </Card>
  );
}

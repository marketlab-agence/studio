'use client';

import { TUTORIALS } from '@/lib/tutorials';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Rocket, FileCode, BookOpen } from 'lucide-react';
import { FileTreeViewer } from '@/components/visualizations/FileTreeViewer';

type Tutorial = typeof TUTORIALS[0];
type TutorialStep = Tutorial['steps'][0];

type TutorialPanelProps = {
  onStepSelect: (step: TutorialStep) => void;
  onStepComplete: (stepId: string) => void;
  completedSteps: Set<string>;
  progress: number;
};

export function TutorialPanel({
  onStepSelect,
  onStepComplete,
  completedSteps,
  progress,
}: TutorialPanelProps) {

  const handleStepClick = (step: TutorialStep) => {
    onStepSelect(step);
    onStepComplete(step.id);
  };

  return (
    <div className="flex h-full flex-col">
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Votre Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Progress value={progress} className="w-full" />
            <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <p className="text-xs text-muted-foreground">Terminez toutes les étapes pour maîtriser les bases de Git !</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="tutorials" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 grid w-auto grid-cols-2">
          <TabsTrigger value="tutorials"><BookOpen className="w-4 h-4 mr-2" />Tutoriels</TabsTrigger>
          <TabsTrigger value="files"><FileCode className="w-4 h-4 mr-2" />Fichiers</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="tutorials" className="m-0">
            <Accordion type="multiple" defaultValue={['intro-to-git']} className="w-full px-4">
              {TUTORIALS.map((tutorial) => (
                <AccordionItem value={tutorial.id} key={tutorial.id}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    {tutorial.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-4">{tutorial.description}</p>
                    <div className="space-y-2">
                      {tutorial.steps.map((step) => (
                        <Card
                          key={step.id}
                          className={`cursor-pointer transition-all hover:border-primary ${completedSteps.has(step.id) ? 'bg-muted/50' : ''}`}
                          onClick={() => handleStepClick(step)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{step.title}</h4>
                              {completedSteps.has(step.id) && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">{step.content}</p>
                            <Badge variant="outline" className="font-code">{step.command}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          <TabsContent value="files" className="m-0">
            <FileTreeViewer />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { TutorialPanel } from '@/components/tutorial-panel';
import { Terminal } from '@/components/terminal';
import { TUTORIALS } from '@/lib/tutorials';

// Infer types from data
type Tutorial = typeof TUTORIALS[0];
type TutorialStep = Tutorial['steps'][0];

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(TUTORIALS[0].steps[0]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const totalSteps = TUTORIALS.reduce((acc, t) => acc + t.steps.length, 0);
  const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;

  const handleStepSelect = (step: TutorialStep) => {
    setCurrentStep(step);
    // Mark step as complete when it's selected
    handleStepComplete(step.id);
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.add(stepId);
      return newSet;
    });
  };
  
  const terminalContext = currentStep?.title || "Bienvenue dans le tutoriel interactif !";
  const initialCommand = currentStep?.command;

  return (
    <div className="flex h-screen w-full bg-background font-sans">
      <aside className="w-[450px] min-w-[350px] max-w-[500px] border-r border-border flex-shrink-0">
        <TutorialPanel
          onStepSelect={handleStepSelect}
          onStepComplete={handleStepComplete}
          completedSteps={completedSteps}
          progress={progress}
        />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <Terminal context={terminalContext} initialCommand={initialCommand} key={currentStep?.id} />
      </main>
    </div>
  );
}

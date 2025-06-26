'use client';

import { useState } from 'react';
import { TutorialPanel } from '@/components/tutorial-panel';
import { Terminal } from '@/components/terminal';
import { TUTORIALS } from '@/lib/tutorials';
import { GitLogoIcon } from '@/components/icons';

export default function Home() {
  const [currentContext, setCurrentContext] = useState(
    'Vous êtes un débutant qui apprend Git. Commencez par présenter la commande `git init`.'
  );
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentCommand, setCurrentCommand] = useState('');
  
  const handleStepSelect = (step: {
    title: string;
    content: string;
    command: string;
  }) => {
    setCurrentContext(
      `L'utilisateur est à l'étape du tutoriel "${step.title}". L'objectif est de comprendre et d'utiliser la commande : \`${step.command}\`. Expliquez cette commande dans le contexte de cette étape.`
    );
    setCurrentCommand(step.command);
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((prev) => new Set(prev).add(stepId));
  };

  const totalSteps = TUTORIALS.flatMap(t => t.steps).length;
  const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-3">
          <GitLogoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold font-headline">Explorateur Git</h1>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="w-full max-w-sm flex-shrink-0 border-r overflow-y-auto">
          <TutorialPanel
            onStepSelect={handleStepSelect}
            completedSteps={completedSteps}
            onStepComplete={handleStepComplete}
            progress={progress}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <Terminal context={currentContext} initialCommand={currentCommand} />
        </div>
      </main>
    </div>
  );
}

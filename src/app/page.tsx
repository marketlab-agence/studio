'use client';

import { useState } from 'react';
import { TutorialPanel } from '@/components/tutorial-panel';
import { Terminal } from '@/components/terminal';
import { TUTORIALS } from '@/lib/tutorials';
import { GitLogoIcon } from '@/components/icons';

export default function Home() {
  const [currentContext, setCurrentContext] = useState(
    'You are a beginner learning about Git. Start by introducing the `git init` command.'
  );
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentCommand, setCurrentCommand] = useState('');
  
  const handleStepSelect = (step: {
    title: string;
    content: string;
    command: string;
  }) => {
    setCurrentContext(
      `The user is on the tutorial step "${step.title}". The goal is to understand and use the command: \`${step.command}\`. Explain this command in the context of this step.`
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
          <h1 className="text-2xl font-semibold font-headline">Git Explorer</h1>
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

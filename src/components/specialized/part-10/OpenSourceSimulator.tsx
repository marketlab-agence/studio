'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, GitBranch, GitCommitHorizontal, GitFork, GitPullRequest, Laptop, Server, History } from 'lucide-react';
import { CodeBlock } from '@/components/ui/CodeBlock';

type Step = 'start' | 'fork' | 'clone' | 'branch' | 'commit' | 'push' | 'pr' | 'done';

const stepsConfig: Record<Step, { title: string; icon: React.ElementType; description: string; command?: string }> = {
  start: { title: 'Démarrer', icon: AlertCircle, description: 'Prêt à contribuer ?' },
  fork: { title: '1. Forker le projet', icon: GitFork, description: 'Créez une copie personnelle du dépôt sur votre compte GitHub.', command: 'Fait sur l\'interface GitHub' },
  clone: { title: '2. Cloner votre fork', icon: Laptop, description: 'Copiez le projet depuis votre fork vers votre machine locale.', command: 'git clone <url-de-votre-fork>' },
  branch: { title: '3. Créer une branche', icon: GitBranch, description: 'Créez une branche dédiée pour isoler vos changements.', command: 'git switch -c fix/login-bug' },
  commit: { title: '4. Faire un commit', icon: GitCommitHorizontal, description: 'Modifiez les fichiers et enregistrez vos changements avec un commit.', command: 'git add . && git commit -m "Fix: ..."' },
  push: { title: '5. Pousser les changements', icon: Server, description: 'Envoyez votre branche et vos commits vers votre fork sur GitHub.', command: 'git push origin fix/login-bug' },
  pr: { title: '6. Ouvrir une Pull Request', icon: GitPullRequest, description: 'Demandez l\'intégration de vos changements dans le projet original.', command: 'Fait sur l\'interface GitHub' },
  done: { title: 'Terminé !', icon: CheckCircle, description: 'Votre contribution a été proposée !' },
};

export function OpenSourceSimulator() {
  const [currentStep, setCurrentStep] = useState<Step>('start');

  const order: Step[] = ['start', 'fork', 'clone', 'branch', 'commit', 'push', 'pr', 'done'];

  const handleNextStep = () => {
    const currentIndex = order.indexOf(currentStep);
    if (currentIndex < order.length - 1) {
      setCurrentStep(order[currentIndex + 1]);
    }
  };

  const handleReset = () => {
    setCurrentStep('start');
  };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Simulateur de Contribution Open Source</CardTitle>
        <CardDescription>Suivez le flux de travail complet pour proposer une modification à un projet.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[250px]">
         <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                >
                    <div className="flex justify-center mb-4">
                        {React.createElement(stepsConfig[currentStep].icon, { className: "h-12 w-12 text-primary" })}
                    </div>
                    <h3 className="text-2xl font-bold">{stepsConfig[currentStep].title}</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">{stepsConfig[currentStep].description}</p>
                    {stepsConfig[currentStep].command && (
                        <CodeBlock className="mt-4 text-sm max-w-sm mx-auto">{stepsConfig[currentStep].command}</CodeBlock>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleReset} variant="ghost" disabled={currentStep === 'start'}>
            <History className="mr-2 h-4 w-4"/>
            Recommencer
        </Button>
        <Button onClick={handleNextStep} disabled={currentStep === 'done'}>
            Étape Suivante
        </Button>
      </CardFooter>
    </Card>
  );
}

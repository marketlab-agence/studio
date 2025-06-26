'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GitPullRequest, MessageSquare, CheckCircle, GitMerge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Step = 'create' | 'review' | 'checks' | 'merge' | 'merged';

const stepsConfig: Record<Step, { title: string; icon: React.ElementType }> = {
  create: { title: 'Open Pull Request', icon: GitPullRequest },
  review: { title: 'Code Review', icon: MessageSquare },
  checks: { title: 'Checks Pass', icon: CheckCircle },
  merge: { title: 'Ready to Merge', icon: GitMerge },
  merged: { title: 'Merged', icon: CheckCircle },
};

export function PRWorkflowSimulator() {
  const [currentStep, setCurrentStep] = useState<Step>('create');

  const handleNextStep = () => {
    const order: Step[] = ['create', 'review', 'checks', 'merge', 'merged'];
    const currentIndex = order.indexOf(currentStep);
    if (currentIndex < order.length - 1) {
      setCurrentStep(order[currentIndex + 1]);
    }
  };

  const handleReset = () => {
    setCurrentStep('create');
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'create':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Vous êtes sur le point de proposer vos changements à la branche principale. Remplissez les détails de votre Pull Request.</p>
            <div className="space-y-2">
              <label htmlFor="pr-title" className="text-sm font-medium">Titre</label>
              <input id="pr-title" defaultValue="feat: Add new user profile page" className="w-full p-2 bg-muted rounded-md border" />
            </div>
            <div className="space-y-2">
              <label htmlFor="pr-desc" className="text-sm font-medium">Description</label>
              <textarea id="pr-desc" defaultValue="Cette PR introduit une nouvelle page de profil utilisateur avec un avatar et les détails de l'utilisateur." className="w-full p-2 bg-muted rounded-md border min-h-[80px]"/>
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Vos coéquipiers examinent votre code et laissent des commentaires.</p>
            <div className="p-3 bg-muted rounded-lg space-y-3">
              <div className="flex gap-3">
                <Avatar><AvatarFallback>DA</AvatarFallback></Avatar>
                <div>
                  <p className="font-semibold text-sm">David A.</p>
                  <div className="text-xs text-muted-foreground">a commenté il y a 2 minutes</div>
                  <p className="mt-2 p-2 bg-background rounded-md text-sm border">Ça a l'air bien ! Juste une petite suggestion : pourrions-nous extraire cette logique dans une fonction utilitaire séparée ?</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'checks':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Les vérifications automatisées (comme les tests et le linting) sont en cours d'exécution sur vos changements.</p>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500"/>
                <span className="font-semibold">Toutes les vérifications ont réussi</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground pl-8">2 vérifications réussies</p>
            </div>
          </div>
        );
       case 'merge':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Cette branche n'a aucun conflit avec la branche de base. La fusion peut être effectuée automatiquement.</p>
            <div className="p-4 bg-green-500/10 rounded-lg flex items-center gap-3 border border-green-500/30">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="font-semibold text-green-400">Prêt à fusionner !</p>
            </div>
          </div>
        );
      case 'merged':
        return (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                    <GitMerge className="h-8 w-8 text-primary"/>
                </div>
            </div>
            <h3 className="text-lg font-bold">Pull Request Fusionnée !</h3>
            <p className="text-sm text-muted-foreground">Vos changements font maintenant partie de la branche `main`.</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  const stepsOrder: Step[] = ['create', 'review', 'checks', 'merge', 'merged'];

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-primary" />
          Simulateur de Workflow de Pull Request
        </CardTitle>
        <CardDescription>Suivez le cycle de vie d'une Pull Request, de la création à la fusion.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px]">
        
        <div className="mb-8 flex justify-between items-start">
            {stepsOrder.map((step, index) => {
                const stepIndex = stepsOrder.indexOf(step);
                const currentStepIndex = stepsOrder.indexOf(currentStep);
                const isActive = currentStepIndex >= stepIndex;
                const isCurrent = currentStep === step;

                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center text-center w-20">
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors border-2",
                                isActive ? "bg-primary border-primary" : "bg-muted border-border",
                                isCurrent && "ring-4 ring-primary/20"
                            )}>
                                <stepsConfig[step].icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                            </div>
                            <p className={cn("text-xs mt-2", isCurrent ? "font-bold text-primary" : "text-muted-foreground")}>{stepsConfig[step].title}</p>
                        </div>
                        {index < stepsOrder.length - 1 && <div className={cn("flex-1 h-0.5 mt-4 mx-2", isActive && currentStepIndex > stepIndex ? "bg-primary" : "bg-border")}></div>}
                    </React.Fragment>
                );
            })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {currentStep === 'merged' ? (
          <Button onClick={handleReset} variant="secondary">Simuler une nouvelle PR</Button>
        ) : (
          <Button onClick={handleNextStep}>
            {currentStep === 'create' && 'Ouvrir la Pull Request'}
            {currentStep === 'review' && 'Approuver les changements'}
            {currentStep === 'checks' && 'Voir le statut de fusion'}
            {currentStep === 'merge' && 'Fusionner la Pull Request'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
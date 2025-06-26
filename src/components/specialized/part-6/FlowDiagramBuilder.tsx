
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, ArrowRight, GitBranch, Bug, Rocket, FolderGit } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepType = 'feature' | 'release' | 'hotfix';

type WorkflowStep = {
    id: number;
    type: StepType;
    name: string;
    icon: React.ElementType;
    color: string;
};

const stepBlueprints: Record<StepType, Omit<WorkflowStep, 'id' | 'name'>> = {
    feature: { type: 'feature', icon: GitBranch, color: 'text-yellow-400' },
    release: { type: 'release', icon: Rocket, color: 'text-purple-400' },
    hotfix: { type: 'hotfix', icon: Bug, color: 'text-red-400' },
};

export function FlowDiagramBuilder() {
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    
    const addStep = (type: StepType) => {
        const count = steps.filter(s => s.type === type).length + 1;
        const newStep: WorkflowStep = {
            id: Date.now(),
            type,
            name: `${type}-${count}`,
            ...stepBlueprints[type]
        };
        setSteps(prev => [...prev, newStep]);
    };

    const removeStep = (id: number) => {
        setSteps(prev => prev.filter(s => s.id !== id));
    };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Constructeur de Diagrammes de Flux</CardTitle>
        <CardDescription>Créez votre propre flux de travail simple en ajoutant des étapes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-lg mb-6">
            <h4 className="font-semibold mb-2 text-sm">Ajouter une étape</h4>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => addStep('feature')}><Plus className="mr-2 h-4 w-4"/> Feature</Button>
                <Button size="sm" variant="outline" onClick={() => addStep('release')}><Plus className="mr-2 h-4 w-4"/> Release</Button>
                <Button size="sm" variant="outline" onClick={() => addStep('hotfix')}><Plus className="mr-2 h-4 w-4"/> Hotfix</Button>
            </div>
        </div>

        <div className="p-4 border border-dashed rounded-lg bg-muted/30 min-h-[200px]">
            <AnimatePresence>
            {steps.length === 0 ? (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Votre diagramme de flux est vide.</p>
                </motion.div>
            ) : (
                <motion.div className="flex flex-col md:flex-row items-center gap-4 p-4 overflow-x-auto">
                    <div className="flex flex-col items-center shrink-0">
                        <FolderGit className="h-8 w-8 text-primary"/>
                        <p className="text-xs font-bold mt-1">Début (main)</p>
                    </div>
                    
                    <AnimatePresence>
                        {steps.map((step) => (
                            <motion.div 
                                key={step.id} 
                                layout
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="flex items-center gap-4 shrink-0"
                            >
                                <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0"/>
                                <div className="relative p-4 border bg-background rounded-lg text-center group">
                                    <step.icon className={cn("h-8 w-8 mx-auto", step.color)} />
                                    <p className="text-sm font-semibold mt-2">{step.name}</p>
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute -top-3 -right-3 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeStep(step.id)}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { PlayCircle, Build, TestTube, Rocket, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ActionStep = {
    id: number;
    name: string;
    run: string;
    icon: React.ElementType;
};

const availableSteps: Record<string, Omit<ActionStep, 'id'>> = {
    test: { name: 'Run tests', run: 'npm test', icon: TestTube },
    build: { name: 'Build project', run: 'npm run build', icon: Build },
    deploy: { name: 'Deploy to production', run: 'vercel deploy --prod', icon: Rocket },
};

const generateYaml = (steps: ActionStep[]) => {
  const intro = `name: CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
`;

  if (steps.length === 0) {
      return `${intro}
      # Ajoutez des étapes pour construire votre workflow`;
  }
  
  const stepsYaml = steps.map(step => `
      - name: ${step.name}
        run: ${step.run}`).join('');

  return intro + stepsYaml;
};

export function ActionsWorkflowBuilder() {
    const [workflowSteps, setWorkflowSteps] = useState<ActionStep[]>([]);

    const addStep = (stepKey: string) => {
        setWorkflowSteps(prev => [...prev, { ...availableSteps[stepKey], id: Date.now() }]);
    };

    const removeStep = (id: number) => {
        setWorkflowSteps(prev => prev.filter(step => step.id !== id));
    };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Constructeur de Workflow GitHub Actions</CardTitle>
        <CardDescription>
          Créez un pipeline CI/CD simple en ajoutant des étapes et visualisez le fichier YAML généré.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Builder UI */}
          <div>
            <h3 className="font-semibold mb-2">Étapes du Workflow</h3>
            <div className="mb-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => addStep('test')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Ajouter 'Test'
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep('build')}>
                    <Build className="mr-2 h-4 w-4" />
                    Ajouter 'Build'
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep('deploy')}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Ajouter 'Deploy'
                </Button>
            </div>
            <div className="p-4 border rounded-lg min-h-[250px] space-y-2 bg-muted/50">
                <AnimatePresence>
                    {workflowSteps.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full text-muted-foreground text-center"
                        >
                            <PlayCircle className="h-10 w-10 mb-2"/>
                            <p className="text-sm">Votre workflow est vide. <br/>Ajoutez une étape pour commencer.</p>
                        </motion.div>
                    )}
                    {workflowSteps.map((step) => (
                        <motion.div
                            key={step.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-between p-3 bg-background rounded-md shadow-sm border"
                        >
                            <div className="flex items-center gap-3">
                                <step.icon className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">{step.name}</p>
                                    <p className="text-xs font-mono text-muted-foreground">{step.run}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
          </div>

          {/* YAML Output */}
          <div>
            <h3 className="font-semibold mb-2">Fichier: <span className="font-mono text-muted-foreground">.github/workflows/ci.yml</span></h3>
            <CodeBlock className="text-sm h-[328px] overflow-y-auto">
              {generateYaml(workflowSteps)}
            </CodeBlock>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
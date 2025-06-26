'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { PlayCircle, Hammer, TestTube, Rocket, Trash2, CheckCircle, CircleDashed, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

type ActionStep = {
    id: number;
    name: string;
    run: string;
    icon: React.ElementType;
};

type Log = {
    id: number;
    step: string;
    message: string;
    status: 'running' | 'success' | 'failure';
};

const availableSteps: Record<string, Omit<ActionStep, 'id'>> = {
    test: { name: 'Run tests', run: 'npm test', icon: TestTube },
    build: { name: 'Build project', run: 'npm run build', icon: Hammer },
    deploy: { name: 'Deploy to production', run: 'echo "Deploying..." && sleep 2 && echo "Deployed!"', icon: Rocket },
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
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install
`;

  if (steps.length === 0) {
      return `${intro}
      # Ajoutez des étapes comme 'test' ou 'build' pour construire votre workflow`;
  }
  
  const stepsYaml = steps.map(step => `
      - name: ${step.name}
        run: ${step.run}`).join('');

  return intro + stepsYaml;
};

export function ActionsWorkflowBuilder() {
    const [workflowSteps, setWorkflowSteps] = useState<ActionStep[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addStep = (stepKey: string) => {
        setWorkflowSteps(prev => [...prev, { ...availableSteps[stepKey], id: Date.now() }]);
    };

    const removeStep = (id: number) => {
        setWorkflowSteps(prev => prev.filter(step => step.id !== id));
    };

    const runSimulation = async () => {
        setIsRunning(true);
        setLogs([]);
        
        const allSteps = [
            { name: 'Setup Job', run: '...' },
            { name: 'Checkout repository', run: '...'},
            { name: 'Set up Node.js', run: '...'},
            { name: 'Install dependencies', run: '...'},
            ...workflowSteps
        ];

        for (const step of allSteps) {
            const logId = Date.now() + Math.random();
            setLogs(prev => [...prev, { id: logId, step: step.name, message: 'en cours...', status: 'running' }]);
            
            await new Promise(res => setTimeout(res, 750)); // Simulate step duration
            
            const success = Math.random() > 0.1; // 90% success rate
            
            setLogs(prev => prev.map(l => l.id === logId ? { ...l, message: success ? 'Terminé' : 'Échoué', status: success ? 'success' : 'failure' } : l));
            
            if (!success) {
                break;
            }
        }
        setIsRunning(false);
    };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Constructeur de Workflow GitHub Actions</CardTitle>
        <CardDescription>
          Créez un pipeline CI/CD, visualisez le fichier YAML, et simulez son exécution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Builder UI */}
          <div>
            <h3 className="font-semibold mb-2">1. Ajoutez des Étapes</h3>
            <div className="mb-4 flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
                <Button variant="outline" size="sm" onClick={() => addStep('test')}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Ajouter 'Test'
                </Button>
                <Button variant="outline" size="sm" onClick={() => addStep('build')}>
                    <Hammer className="mr-2 h-4 w-4" />
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
                            <p className="text-sm">Votre workflow est vide.</p>
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
            <h3 className="font-semibold mb-2">2. Visualisez le Fichier YAML</h3>
            <CodeBlock className="text-sm h-[328px] overflow-y-auto">
              {generateYaml(workflowSteps)}
            </CodeBlock>
          </div>
        </div>

        {/* Log Output */}
        <div className="mt-6">
            <h3 className="font-semibold mb-2">3. Simulez l'Exécution</h3>
             <div className="flex items-center justify-between">
                <Button onClick={runSimulation} disabled={isRunning}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {isRunning ? 'Exécution en cours...' : 'Lancer le Workflow'}
                </Button>
            </div>
            <ScrollArea className="h-48 mt-4 p-4 font-mono text-xs bg-muted rounded-md border">
                {logs.length === 0 && <p className="text-muted-foreground">Les logs apparaîtront ici...</p>}
                {logs.map(log => (
                    <div key={log.id} className="flex items-center gap-2">
                        {log.status === 'running' && <CircleDashed className="h-4 w-4 animate-spin text-primary" />}
                        {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {log.status === 'failure' && <XCircle className="h-4 w-4 text-destructive" />}
                        <span className="font-bold w-48 truncate">{log.step}</span>
                        <span>{log.message}</span>
                    </div>
                ))}
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

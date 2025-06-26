'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, HardDrive, ArrowRight, User } from 'lucide-react';
import { CodeBlock } from '@/components/ui/CodeBlock';

const FlowBox = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center p-4 border rounded-lg bg-background/50 w-48 h-48 justify-center">
        <Icon className="h-10 w-10 text-primary mb-2" />
        <p className="font-bold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
);

const ActionArrow = ({ command }: { command: string }) => (
    <div className="flex flex-col items-center justify-center mx-4">
        <ArrowRight className="h-8 w-8 text-muted-foreground" />
        <p className="text-xs font-mono mt-2 text-primary">{command}</p>
    </div>
);

export function ForkVsCloneDemo() {
  return (
    <Card className="my-6 bg-transparent border-border/50">
      <CardHeader>
        <CardTitle>Démonstration Fork vs Clone</CardTitle>
        <CardDescription>Visualisez les deux flux de travail principaux pour obtenir une copie d'un projet.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fork" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fork">Contributeur (Fork & Clone)</TabsTrigger>
                <TabsTrigger value="maintainer">Mainteneur (Clone)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fork" className="mt-4">
                <div className="p-4 border rounded-lg bg-card">
                    <h3 className="font-semibold mb-2">Scénario : Vous voulez contribuer à un projet open-source.</h3>
                    <p className="text-sm text-muted-foreground mb-6">Vous n'avez pas les droits d'écriture sur le projet original. Vous devez d'abord créer une copie personnelle (fork) sur votre compte GitHub.</p>
                    <motion.div 
                        className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.2, delayChildren: 0.1 }}
                    >
                        <FlowBox icon={Server} title="Projet Original" description="ex: `react/react`" />
                        <ActionArrow command="1. Fork" />
                        <FlowBox icon={User} title="Votre Fork GitHub" description="ex: `votre-nom/react`" />
                        <ActionArrow command="2. Clone" />
                        <FlowBox icon={HardDrive} title="Votre Machine Locale" description="Copie de votre fork" />
                    </motion.div>
                    <CodeBlock className="mt-6 text-sm">
                        # Étape 1: Vous forkez sur l'interface de GitHub.com<br/>
                        # Étape 2: Vous clonez VOTRE fork (et non l'original)<br/>
                        git clone https://github.com/votre-nom/nom-du-projet.git
                    </CodeBlock>
                </div>
            </TabsContent>

            <TabsContent value="maintainer" className="mt-4">
                 <div className="p-4 border rounded-lg bg-card">
                    <h3 className="font-semibold mb-2">Scénario : Vous êtes mainteneur ou membre de l'équipe.</h3>
                    <p className="text-sm text-muted-foreground mb-6">Vous avez les droits d'écriture directs sur le projet. Vous pouvez cloner le dépôt directement.</p>
                     <motion.div 
                        className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.2, delayChildren: 0.1 }}
                    >
                        <FlowBox icon={Server} title="Projet Original" description="ex: `votre-equipe/projet`" />
                        <ActionArrow command="Clone" />
                        <FlowBox icon={HardDrive} title="Votre Machine Locale" description="Copie directe du projet" />
                    </motion.div>
                     <CodeBlock className="mt-6 text-sm">
                        git clone https://github.com/nom-equipe/nom-du-projet.git
                    </CodeBlock>
                </div>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
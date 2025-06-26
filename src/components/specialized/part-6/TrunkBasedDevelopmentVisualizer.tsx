'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitCommitHorizontal, GitMerge, Code, TestTube, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TBD_STEPS = [
  { icon: Code, title: "Petit commit", description: "Un développeur fait un petit changement et le commit sur la branche principale." },
  { icon: TestTube, title: "Tests automatisés", description: "Les tests (CI) s'exécutent automatiquement pour valider le changement." },
  { icon: GitMerge, title: "Intégration", description: "Si les tests passent, le changement est intégré. Sinon, il est annulé ou corrigé rapidement." },
  { icon: Rocket, title: "Déploiement (optionnel)", description: "La branche principale est déployée en continu ou à la demande." },
];

export function TrunkBasedDevelopmentVisualizer() {
  return (
    <Card className="my-6 bg-transparent border-border/50">
      <CardHeader>
        <CardTitle>Visualisation du Trunk-Based Development</CardTitle>
        <CardDescription>Dans ce flux, tous les développeurs travaillent directement sur une seule branche : le "trunk" (souvent `main`).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="font-semibold text-center mb-4">Le flux de vie d'un changement</h4>
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {TBD_STEPS.map((step, i) => (
              <React.Fragment key={step.title}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col items-center text-center p-3 border rounded-lg bg-card w-32 md:w-40"
                >
                  <step.icon className="h-8 w-8 text-primary mb-2" />
                  <p className="font-bold text-sm">{step.title}</p>
                </motion.div>
                {i < TBD_STEPS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.2 + 0.1 }}
                  >
                     <div className="w-4 h-1 bg-muted-foreground rounded-full hidden md:block"></div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
           <h4 className="font-semibold text-center mb-4">La branche `main` (le Trunk)</h4>
            <div className="relative p-4 border-2 border-dashed rounded-lg">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-primary"></div>
                <div className="relative flex justify-around">
                    <div className="flex flex-col items-center bg-background px-2">
                        <GitCommitHorizontal className="h-8 w-8 text-primary" />
                        <Badge variant="secondary" className="mt-2">Dev A</Badge>
                    </div>
                    <div className="flex flex-col items-center bg-background px-2">
                        <GitCommitHorizontal className="h-8 w-8 text-primary" />
                         <Badge variant="secondary" className="mt-2">Dev B</Badge>
                    </div>
                     <div className="flex flex-col items-center bg-background px-2">
                        <GitCommitHorizontal className="h-8 w-8 text-primary" />
                         <Badge variant="secondary" className="mt-2">Dev A</Badge>
                    </div>
                     <div className="flex flex-col items-center bg-background px-2">
                        <GitCommitHorizontal className="h-8 w-8 text-primary" />
                         <Badge variant="secondary" className="mt-2">Dev C</Badge>
                    </div>
                </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Tous les commits sont petits, fréquents et directement sur la branche principale.</p>
        </div>
      </CardContent>
    </Card>
  );
}

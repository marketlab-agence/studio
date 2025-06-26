'use client';

import React, { useState } from 'react';
import { History, GitCommitHorizontal, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { AnimatePresence, motion } from 'framer-motion';

const commitHistory = [
  { id: 'a1b2c3d', message: 'Commit initial', content: 'Version 1 du fichier.' },
  { id: 'f4e5d6c', message: 'Ajout du titre principal', content: '# Mon Titre\nVersion 2 du fichier.' },
  { id: 'h7g8f9e', message: 'Correction faute de frappe', content: '# Mon Titre\nVersion 3 du fichier corrigée.' },
  { id: 'k0l9m8n', message: 'Ajout de la conclusion', content: '# Mon Titre\nVersion 3 du fichier corrigée.\n\nCeci est la fin.' },
];

export function TimelineNavigator() {
  const [currentCommitIndex, setCurrentCommitIndex] = useState(commitHistory.length - 1);

  const handleSliderChange = (value: number[]) => {
    setCurrentCommitIndex(value[0]);
  };
  
  const currentCommit = commitHistory[currentCommitIndex];

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Navigateur de Timeline
        </CardTitle>
        <CardDescription>
          Naviguez dans l'historique des commits pour voir l'état du projet à différents moments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{commitHistory[0].id.substring(0,7)} (Ancien)</span>
                <span>{commitHistory[commitHistory.length-1].id.substring(0,7)} (Récent)</span>
            </div>
            <Slider 
                defaultValue={[commitHistory.length - 1]} 
                max={commitHistory.length - 1} 
                step={1}
                onValueChange={handleSliderChange}
            />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <GitCommitHorizontal className="h-4 w-4"/>
                        Détails du Commit
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="font-mono text-sm">{currentCommit.id}</p>
                    <p className="text-lg font-semibold">{currentCommit.message}</p>
                    <Button variant="outline" size="sm">
                      Revenir à ce commit (`git checkout`)
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-muted/50">
                <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4"/>
                        Contenu de `README.md`
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCommit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CodeBlock className="whitespace-pre-wrap">{currentCommit.content}</CodeBlock>
                        </motion.div>
                     </AnimatePresence>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}

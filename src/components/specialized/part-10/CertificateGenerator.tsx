'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Award, GitCommitHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function CertificateGenerator() {
    const [name, setName] = useState('');
    const [generated, setGenerated] = useState(false);
    const [completionDate, setCompletionDate] = useState('');

    const handleGenerate = () => {
        if (name.trim()) {
            setCompletionDate(new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }));
            setGenerated(true);
        }
    };

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Générateur de Certificat</CardTitle>
        <CardDescription>Entrez votre nom pour générer votre certificat de réussite.</CardDescription>
      </CardHeader>
      <CardContent>
        {!generated ? (
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Input 
                    placeholder="Votre nom complet" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Button onClick={handleGenerate} disabled={!name.trim()}>Générer mon certificat</Button>
            </div>
        ) : (
             <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="max-w-2xl mx-auto bg-gradient-to-br from-background to-muted/50 border-primary/20 shadow-lg">
                        <CardContent className="p-8 text-center relative overflow-hidden">
                            <Award className="absolute -top-10 -left-10 h-32 w-32 text-primary/5 opacity-50" />
                            <Award className="absolute -bottom-12 -right-16 h-40 w-40 text-primary/5 opacity-50 rotate-45" />

                            <div className="mb-4">
                                <Award className="h-16 w-16 text-primary mx-auto" />
                            </div>
                            <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">Certificat de Réussite</h2>
                            <p className="text-muted-foreground mt-4">décerné à</p>
                            <h1 className="text-4xl font-bold my-4 text-primary">{name}</h1>
                            <p className="text-muted-foreground">pour avoir terminé avec succès le tutoriel</p>
                            <h3 className="text-2xl font-semibold my-2">Git & GitHub Interactif</h3>
                             <div className="flex items-center justify-center gap-2 text-muted-foreground my-6">
                                <div className="flex-1 h-px bg-border" />
                                <GitCommitHorizontal className="h-4 w-4" />
                                <div className="flex-1 h-px bg-border" />
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{completionDate}</span>
                                <span>Git Explorer</span>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="text-center mt-4">
                        <Button variant="outline" onClick={() => setGenerated(false)}>Générer un autre certificat</Button>
                    </div>
                </motion.div>
            </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}

'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitCommitHorizontal, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

export function CertificateGenerator() {
    const [name, setName] = useState('');
    const [generated, setGenerated] = useState(false);
    const [completionDate, setCompletionDate] = useState('');
    const [certificateId, setCertificateId] = useState('');

    const handleGenerate = () => {
        if (name.trim()) {
            setCompletionDate(new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }));
             setCertificateId(`GHI-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
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
                    <div className="w-full max-w-3xl mx-auto border-4 border-primary/20 bg-card p-2 rounded-lg shadow-2xl">
                      <div className="border-2 border-primary/30 p-8 text-center relative flex flex-col items-center space-y-6 bg-background/50">
                        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-md"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-md"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-md"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-md"></div>
                        
                        <div className="flex items-center gap-4">
                            <GitCommitHorizontal className="h-10 w-10 text-primary"/>
                            <h1 className="text-2xl font-bold">Git & GitHub Interactif</h1>
                        </div>

                        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Certificat d'Accomplissement</p>
                        
                        <p className="text-muted-foreground">est décerné à</p>
                        
                        <h2 className="text-5xl font-bold font-headline text-primary">{name}</h2>
                        
                        <p className="max-w-lg text-muted-foreground">
                            pour avoir démontré avec succès sa maîtrise des compétences fondamentales et avancées en contrôle de version avec Git et en collaboration sur GitHub.
                        </p>

                        <div className="pt-8 w-full grid grid-cols-3 items-end gap-4">
                            <div className="text-left text-xs space-y-1">
                                <p className="font-code text-muted-foreground">Certificat No: {certificateId}</p>
                                <p className="font-code text-muted-foreground">Date d'émission: {completionDate}</p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="relative h-20 w-20">
                                    <div className="absolute inset-0 rounded-full bg-primary/20"></div>
                                    <div className="absolute inset-1 rounded-full border-2 border-dashed border-primary/50"></div>
                                    <ShieldCheck className="absolute inset-0 m-auto h-10 w-10 text-primary" />
                                </div>
                                <p className="text-sm font-semibold mt-2">Git Explorer Academy</p>
                            </div>

                            <div className="text-center">
                                <Image
                                  src="/signature.png"
                                  alt="Signature de l'instructeur"
                                  width={200}
                                  height={75}
                                  className="mx-auto dark:invert"
                                  priority
                                />
                                <div className="h-px w-full bg-foreground my-1 max-w-[200px] mx-auto"></div>
                                <p className="text-sm font-semibold">L'Instructeur</p>
                            </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-6">
                        <Button variant="outline" onClick={() => setGenerated(false)}>Générer un autre certificat</Button>
                    </div>
                </motion.div>
            </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}

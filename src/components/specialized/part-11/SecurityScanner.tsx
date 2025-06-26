'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, ShieldCheck, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ScanStatus = 'idle' | 'scanning' | 'safe' | 'vulnerable';

const fakeVulnerabilities = [
    { file: '.env', line: 1, issue: 'Fichier sensible commit. Doit être dans .gitignore.' },
    { file: 'src/api/db.js', line: 12, issue: 'Clé API "sk_live_..." détectée en clair.' }
]

export function SecurityScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');

  const handleScan = () => {
    setStatus('scanning');
    setTimeout(() => {
      // 50% chance to find vulnerabilities in this demo
      setStatus(Math.random() > 0.5 ? 'safe' : 'vulnerable');
    }, 2000);
  };

  const renderStatus = () => {
    switch (status) {
        case 'scanning':
            return <div className="flex items-center gap-2 text-primary"><Search className="animate-pulse"/>Analyse en cours...</div>
        case 'safe':
            return <div className="flex items-center gap-2 text-green-400"><ShieldCheck />Aucune vulnérabilité évidente trouvée.</div>
        case 'vulnerable':
            return <div className="flex items-center gap-2 text-red-400"><ShieldAlert />Vulnérabilités détectées !</div>
        case 'idle':
        default:
            return <div className="text-muted-foreground">Prêt à analyser le projet.</div>;
    }
  }

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Démonstration des Bonnes Pratiques de Sécurité</CardTitle>
        <CardDescription>Lancez une analyse simulée pour détecter des secrets ou des clés API commités par erreur.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
            <Button onClick={handleScan} disabled={status === 'scanning'}>
                <Shield className="mr-2 h-4 w-4" />
                {status === 'scanning' ? 'Analyse en cours...' : 'Lancer l\'analyse'}
            </Button>
            <div className="font-semibold text-sm">{renderStatus()}</div>
        </div>

        <AnimatePresence>
        {status === 'vulnerable' && (
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg space-y-2">
                <h4 className="font-bold">Rapport d'analyse :</h4>
                <ul className="list-disc pl-5 text-sm">
                   {fakeVulnerabilities.map(vuln => (
                       <li key={vuln.file+vuln.line}>
                           <span className="font-mono bg-background/50 px-1 py-0.5 rounded">{vuln.file}:{vuln.line}</span> - {vuln.issue}
                        </li>
                   ))}
                </ul>
            </motion.div>
        )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}


'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitCommitHorizontal, ShieldCheck, Download, Linkedin, Loader2, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export function CertificateGenerator({ courseTitle, averageQuizScore, masteryIndex, instructorName }: { courseTitle: string, averageQuizScore: number, masteryIndex: number, instructorName: string }) {
    const { user, loading } = useAuth();
    const [name, setName] = useState('');
    const [generated, setGenerated] = useState(false);
    const [completionDate, setCompletionDate] = useState('');
    const [certificateId, setCertificateId] = useState('');
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (user?.displayName) {
            setName(user.displayName);
        }
    }, [user]);


    const handleGenerate = () => {
        if (name.trim()) {
            setCompletionDate(new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }));
             setCertificateId(`KAT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
            setGenerated(true);
        }
    };
    
    const getMentionText = () => {
        if (averageQuizScore >= 98) {
            return "avec mention Excellence, pour sa compréhension exceptionnelle et sa maîtrise du premier coup.";
        }
        if (averageQuizScore >= 90) {
            return "avec mention Très Bien, pour sa solide et constante maîtrise des concepts.";
        }
        return `pour avoir démontré avec succès sa maîtrise des compétences sur la formation "${courseTitle}".`;
    };

    const handleDownloadPdf = async () => {
        if (!certificateRef.current || isDownloading) return;
        setIsDownloading(true);

        const element = certificateRef.current;
        const scale = 2;

        try {
            const { default: html2canvas } = await import('html2canvas');
            const { default: jsPDF } = await import('jspdf');

            const canvas = await html2canvas(element, { 
                scale: scale,
                useCORS: true,
                backgroundColor: '#0f172a'
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificat-katalyst-${name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        } catch (err) {
            console.error("Erreur lors de la génération du PDF : ", err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShareLinkedIn = () => {
        const text = `Fier d'avoir obtenu ma certification "${courseTitle}" sur la plateforme d'apprentissage interactif Katalyst ! #FormationContinue #Katalyst`;
        const url = window.location.origin;
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

  return (
    <div className="my-6">
        {!generated ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                 <div className="flex-1 w-full sm:w-auto">
                    <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm h-10 flex items-center">
                        {loading || !user?.displayName ? (
                            <span className="italic">Chargement...</span>
                        ) : (
                            <span className="font-medium text-foreground">{user.displayName}</span>
                        )}
                    </div>
                </div>
                <Button onClick={handleGenerate} disabled={loading || !user?.displayName} className="w-full sm:w-auto">
                    Générer mon certificat
                </Button>
            </div>
        ) : (
             <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div ref={certificateRef} className="w-full max-w-3xl mx-auto border-4 border-primary/20 bg-card p-2 rounded-lg shadow-2xl">
                      <div className="border-2 border-primary/30 p-8 text-center relative flex flex-col items-center space-y-6 bg-background/50">
                        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-md"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-md"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-md"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-md"></div>
                        
                        <div className="flex items-center gap-4">
                            <GitCommitHorizontal className="h-10 w-10 text-primary"/>
                            <h1 className="text-2xl font-bold">{courseTitle}</h1>
                        </div>

                        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Certificat d'Accomplissement</p>
                        
                        <p className="text-muted-foreground">est décerné à</p>
                        
                        <h2 className="text-5xl font-bold font-headline text-primary">{name}</h2>
                        
                        <p className="max-w-xl text-muted-foreground">
                            {getMentionText()}
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
                                <p className="text-sm font-semibold mt-2">Katalyst Academy</p>
                            </div>

                            <div className="text-center">
                                <p className="font-signature text-4xl text-foreground/80 mb-2">{instructorName}</p>
                                <div className="h-px w-full bg-foreground/80 max-w-[200px] mx-auto"></div>
                                <p className="text-sm font-semibold mt-1">L'Instructeur</p>
                            </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-8 flex flex-wrap justify-center gap-4">
                        <Button variant="outline" onClick={() => setGenerated(false)}>Retour</Button>
                        <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="mr-2 animate-spin"/> : <Download className="mr-2"/>}
                            {isDownloading ? 'Génération...' : 'Télécharger en PDF'}
                        </Button>
                        <Button onClick={handleShareLinkedIn}>
                            <Linkedin className="mr-2" />
                            Partager sur LinkedIn
                        </Button>
                    </div>
                </motion.div>
            </AnimatePresence>
        )}
      </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Wand2, Loader2, BookCopy, GraduationCap, Target, Save, AlertTriangle } from 'lucide-react';
import { createCoursePlan, type CreateCourseOutput } from '@/ai/flows/create-course-flow';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function CreateCoursePage() {
    const [topic, setTopic] = useState('');
    const [targetAudience, setTargetAudience] = useState('Débutants');
    const [isLoading, setIsLoading] = useState(false);
    const [coursePlan, setCoursePlan] = useState<CreateCourseOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGeneratePlan = async () => {
        if (!topic) {
            setError("Veuillez entrer un sujet pour la formation.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setCoursePlan(null);
        try {
            const plan = await createCoursePlan({ topic, targetAudience });
            setCoursePlan(plan);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la génération du plan. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveCourse = () => {
        // Here you would implement logic to save the coursePlan to your database.
        toast({
            title: "Formation sauvegardée (Simulation)",
            description: "Le plan de formation a été sauvegardé avec succès.",
        });
    }

    const renderLoadingState = () => (
        <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-2 pt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
    
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Wand2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Créateur de Formation Assisté par IA</h1>
          <p className="text-muted-foreground">Générez un plan de cours complet à partir d'un simple sujet.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>1. Décrivez votre formation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <label htmlFor="topic" className="font-medium text-sm">Sujet de la formation</label>
                <Textarea 
                    id="topic"
                    placeholder="Ex: Une introduction à Docker pour les développeurs web" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1"
                />
            </div>
             <div>
                <label htmlFor="audience" className="font-medium text-sm">Public Cible</label>
                <Input 
                    id="audience"
                    placeholder="Ex: Débutants, Développeurs expérimentés" 
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="mt-1"
                />
            </div>
            <Button onClick={handleGeneratePlan} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Générer le plan de formation
            </Button>
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>
      
      {(isLoading || coursePlan) && (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>2. Plan de Formation Généré</CardTitle>
                 <CardDescription>Voici le plan de formation suggéré par l'IA. Vous pouvez le modifier avant de le sauvegarder.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? renderLoadingState() : coursePlan && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold">{coursePlan.title}</h2>
                            <p className="text-muted-foreground mt-2">{coursePlan.description}</p>
                        </div>
                        <Accordion type="multiple" defaultValue={coursePlan.chapters.length > 0 ? [coursePlan.chapters[0].title] : []} className="w-full">
                            {coursePlan.chapters.map((chapter, index) => (
                                <AccordionItem value={chapter.title} key={index}>
                                    <AccordionTrigger className="text-lg">{index + 1}. {chapter.title}</AccordionTrigger>
                                    <AccordionContent className="pl-2 space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold flex items-center gap-2"><BookCopy className="h-4 w-4 text-primary"/>Leçons</h4>
                                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                                {chapter.lessons.map((lesson, lessonIndex) => (
                                                    <li key={lessonIndex}>
                                                        <strong className="text-foreground">{lesson.title}:</strong> {lesson.objective}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary"/>Quiz</h4>
                                            <p className="text-sm">Le quiz portera sur :</p>
                                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                                {chapter.quiz.topics.map((topic, topicIndex) => (
                                                     <li key={topicIndex}>{topic}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <Button onClick={handleSaveCourse} size="lg" className="mt-6">
                            <Save className="mr-2 h-4 w-4"/>
                            Sauvegarder cette formation
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

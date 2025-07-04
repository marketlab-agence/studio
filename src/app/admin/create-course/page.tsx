
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Wand2, BrainCircuit, Loader2, Save, AlertTriangle, Trash2, Pencil, History, ChevronRight, BookCopy, GraduationCap, PlusCircle, CircleDashed, CheckCircle, Rocket, Eye, Info
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { createCoursePlan, type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { buildCourseFromPlanAction, savePlanAction, generateAndSaveLessonMarkdown, suggestAndSaveLessonComponents } from '@/actions/courseActions';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { type SuggestLessonComponentsOutput } from '@/ai/flows/suggest-lesson-components-flow';
import { Badge } from '@/components/ui/badge';
import { COURSES } from '@/lib/courses';

type StoredPlan = { plan: CreateCourseOutput; params: CreateCourseInput; localId: string; createdAt: Date };
type BuildStep = {
    type: 'lesson' | 'quiz' | 'complete';
    chapterIndex: number;
    lessonIndex?: number;
    title: string;
};
type GeneratedContent = { illustrativeContent: string } & Partial<SuggestLessonComponentsOutput>;


export default function CreateCoursePage() {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    // === View State ===
    const [isBuildingMode, setIsBuildingMode] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isSavingPlan, setIsSavingPlan] = useState(false);
    const [isCreatingCourse, setIsCreatingCourse] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // === Planner State ===
    const [topic, setTopic] = useState('');
    const [targetAudience, setTargetAudience] = useState('Débutants');
    const [numChapters, setNumChapters] = useState('');
    const [numLessons, setNumLessons] = useState('');
    const [numQuestions, setNumQuestions] = useState('');
    const [language, setLanguage] = useState('Français');
    const [lessonLength, setLessonLength] = useState<'Court' | 'Moyen' | 'Long'>('Moyen');
    const [allowMultipleChoice, setAllowMultipleChoice] = useState(true);
    const [feedbackTiming, setFeedbackTiming] = useState<'end' | 'immediate'>('end');
    const [generatedPlans, setGeneratedPlans] = useLocalStorage<StoredPlan[]>('generatedCoursePlans', [], {
        deserializer: (value) => {
            try {
                const parsed = JSON.parse(value) as StoredPlan[];
                return parsed.map(plan => ({ ...plan, createdAt: new Date(plan.createdAt) }));
            } catch { return []; }
        }
    });
    const [activePlanId, setActivePlanId] = useLocalStorage<string | null>('activeCoursePlanId', null);
    
    const activeStoredPlan = useMemo(() => generatedPlans.find(p => p.localId === activePlanId), [generatedPlans, activePlanId]);
    const activePlan = activeStoredPlan?.plan;

    // === Builder State ===
    const [buildingCourseId, setBuildingCourseId] = useState<string | null>(null);
    const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isBuilding, setIsBuilding] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    
    // Mount state to prevent hydration errors
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Effect to load a plan from URL param on initial load
    useEffect(() => {
        const planIdToLoad = searchParams.get('planId');
        if (planIdToLoad && planIdToLoad !== activePlanId) {
            const courseToLoad = COURSES.find(c => c.id === planIdToLoad);
            if (courseToLoad?.plan && courseToLoad?.generationParams) {
                const storedPlanFromCourse: StoredPlan = {
                    plan: courseToLoad.plan,
                    params: courseToLoad.generationParams,
                    localId: courseToLoad.id,
                    createdAt: new Date(),
                };
                
                setGeneratedPlans(prev => [storedPlanFromCourse, ...prev.filter(p => p.localId !== storedPlanFromCourse.localId)]);
                setActivePlanId(storedPlanFromCourse.localId);
            }
        }
    }, [searchParams]);

    // Effect to sync the form state whenever the active plan changes
    useEffect(() => {
        if (activeStoredPlan && activeStoredPlan.params) {
            const { params } = activeStoredPlan;
            setTopic(params.topic);
            setTargetAudience(params.targetAudience);
            setNumChapters(params.numChapters?.toString() || '');
            setNumLessons(params.numLessonsPerChapter?.toString() || '');
            setNumQuestions(params.numQuestionsPerQuiz?.toString() || '');
            setLanguage(params.courseLanguage || 'Français');
            setLessonLength(params.lessonLength || 'Moyen');
            setAllowMultipleChoice(params.allowMultipleChoice ?? true);
            setFeedbackTiming(params.feedbackTiming ?? 'end');
        }
    }, [activeStoredPlan]);


    const handleGeneratePlan = async () => {
        if (!topic || !targetAudience) {
            setError("Le sujet et le public cible sont obligatoires.");
            return;
        }
        setIsGeneratingPlan(true);
        setError(null);
        setActivePlanId(null);
        try {
            const params: CreateCourseInput = { topic, targetAudience, numChapters: numChapters ? parseInt(numChapters, 10) : undefined, numLessonsPerChapter: numLessons ? parseInt(numLessons, 10) : undefined, numQuestionsPerQuiz: numQuestions ? parseInt(numQuestions, 10) : undefined, courseLanguage: language || undefined, lessonLength, allowMultipleChoice, feedbackTiming };
            const plan = await createCoursePlan(params);
            
            const newStoredPlan: StoredPlan = { 
                plan, 
                params, 
                localId: Date.now().toString(), 
                createdAt: new Date() 
            };

            setGeneratedPlans(prev => [newStoredPlan, ...prev]);
            setActivePlanId(newStoredPlan.localId);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la génération du plan. Veuillez réessayer.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };
    
    const handleSavePlanAndRedirect = async () => {
        if (!activePlan) return;
        setIsSavingPlan(true);
        try {
            const generationParams: CreateCourseInput = { topic, targetAudience, numChapters: numChapters ? parseInt(numChapters, 10) : undefined, numLessonsPerChapter: numLessons ? parseInt(numLessons, 10) : undefined, numQuestionsPerQuiz: numQuestions ? parseInt(numQuestions, 10) : undefined, courseLanguage: language || undefined, lessonLength, allowMultipleChoice, feedbackTiming };
            await savePlanAction(activePlan, generationParams);
            toast({ title: "Plan sauvegardé !", description: "Redirection vers la liste des formations..." });
            router.push(`/admin/courses`);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la sauvegarde du plan.");
            setIsSavingPlan(false);
        }
    };

    const handleStartCourseBuild = async () => {
        if (!activePlan) return;
        setIsCreatingCourse(true);
        setError(null);
        try {
            const generationParams: CreateCourseInput = { topic, targetAudience, numChapters: numChapters ? parseInt(numChapters, 10) : undefined, numLessonsPerChapter: numLessons ? parseInt(numLessons, 10) : undefined, numQuestionsPerQuiz: numQuestions ? parseInt(numQuestions, 10) : undefined, courseLanguage: language || undefined, lessonLength, allowMultipleChoice, feedbackTiming };
            const { courseId } = await savePlanAction(activePlan, generationParams);
            await buildCourseFromPlanAction(courseId);
            setBuildingCourseId(courseId);

            const steps: BuildStep[] = [];
            activePlan.chapters.forEach((chapter, cIndex) => {
                chapter.lessons.forEach((lesson, lIndex) => {
                    steps.push({ type: 'lesson', chapterIndex: cIndex, lessonIndex: lIndex, title: lesson.title });
                });
                steps.push({ type: 'quiz', chapterIndex: cIndex, title: `Quiz: ${chapter.title}` });
            });
            setBuildSteps(steps);
            setCurrentStepIndex(0);
            setGeneratedContent(null);
            setIsBuildingMode(true);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors du lancement de la création. Veuillez réessayer.");
        } finally {
            setIsCreatingCourse(false);
        }
    };

    const handleBuildContinue = () => {
        setGeneratedContent(null);
        setCurrentStepIndex(prev => prev + 1);
    };

    const handleFinishBuild = () => {
        if (activeStoredPlan) {
            handleDeletePlan(activeStoredPlan.localId);
        }
        toast({
            title: "Formation créée avec succès !",
            description: "Vous êtes redirigé vers la page d'édition de la formation.",
        });
        router.push(`/admin/courses/${buildingCourseId}`);
    };

    // Auto-trigger generation when step changes
    useEffect(() => {
        if (isBuildingMode && currentStepIndex < buildSteps.length) {
            const step = buildSteps[currentStepIndex];
            
            const generateStepContent = async () => {
                setIsBuilding(true);
                setGeneratedContent(null);
                try {
                    if (step.type === 'lesson' && buildingCourseId && typeof step.lessonIndex !== 'undefined') {
                        const { illustrativeContent } = await generateAndSaveLessonMarkdown(buildingCourseId, step.chapterIndex, step.lessonIndex);
                        const { interactiveComponentName, visualComponentName } = await suggestAndSaveLessonComponents(buildingCourseId, step.chapterIndex, step.lessonIndex);
                        setGeneratedContent({ illustrativeContent, interactiveComponentName, visualComponentName });
                    } else if (step.type === 'quiz') {
                        setGeneratedContent({ illustrativeContent: `Le quiz "**${step.title}**" a été créé à partir du plan. Vous pourrez le modifier plus tard dans l'éditeur de cours.`});
                    }
                } catch (e) {
                    setError('Une erreur est survenue lors de la génération du contenu.');
                    console.error(e);
                } finally {
                    setIsBuilding(false);
                }
            };
            generateStepContent();
        }
    }, [isBuildingMode, currentStepIndex, buildSteps, buildingCourseId]);


    // Planner View helpers
    const handleDeletePlan = (idToDelete: string) => { setGeneratedPlans(prev => prev.filter(p => p.localId !== idToDelete)); if (activePlanId === idToDelete) { setActivePlanId(null); } };
    const updateActivePlan = (updater: (plan: CreateCourseOutput) => CreateCourseOutput) => {
        if (!activePlanId) return;
        setGeneratedPlans(prevPlans => prevPlans.map(p => {
            if (p.localId === activePlanId) {
                return { ...p, plan: updater(p.plan) };
            }
            return p;
        }));
    };
    const handlePlanChange = (field: 'title' | 'description', value: string) => updateActivePlan(plan => ({ ...plan, [field]: value }));
    const handleChapterChange = (chapterIndex: number, field: 'title', value: string) => { updateActivePlan(plan => { const newChapters = [...plan.chapters]; newChapters[chapterIndex] = { ...newChapters[chapterIndex], [field]: value }; return { ...plan, chapters: newChapters }; }); };
    const handleLessonChange = (chapterIndex: number, lessonIndex: number, field: keyof CreateCourseOutput['chapters'][0]['lessons'][0], value: string) => { updateActivePlan(plan => { const newChapters = [...plan.chapters]; const newLessons = [...newChapters[chapterIndex].lessons]; newLessons[lessonIndex] = { ...newLessons[lessonIndex], [field]: value }; newChapters[chapterIndex] = { ...newChapters[chapterIndex], lessons: newLessons }; return { ...plan, chapters: newChapters }; }); };
    const renderPlanLoadingState = () => <div className="space-y-4 mt-6"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /><div className="space-y-2 pt-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></div>;
    const renderEditablePlan = () => activePlan && activeStoredPlan && (
      <div className="space-y-6">
          {activeStoredPlan.params && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="generation-params">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline px-4 py-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-primary" />
                          Voir les paramètres de génération utilisés
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t-0 border rounded-b-md bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Sujet</p><p>{activeStoredPlan.params.topic}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Public Cible</p><p>{activeStoredPlan.params.targetAudience}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Langue</p><p>{activeStoredPlan.params.courseLanguage || 'Français'}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Longueur des leçons</p><p>{activeStoredPlan.params.lessonLength || 'Moyen'}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Chapitres</p><p>{activeStoredPlan.params.numChapters || 'Auto'}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Leçons / Chapitre</p><p>{activeStoredPlan.params.numLessonsPerChapter || 'Auto'}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Questions / Quiz</p><p>{activeStoredPlan.params.numQuestionsPerQuiz || 'Auto'}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">Type de Quiz</p><p>{activeStoredPlan.params.allowMultipleChoice ? 'Choix multiples permis' : 'Choix unique uniquement'}</p></div>
                      </div>
                  </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <div className="space-y-4 rounded-lg border bg-background p-6"><div className="space-y-2"><Label htmlFor="courseTitle" className="text-lg font-semibold">Titre de la Formation</Label><Input id="courseTitle" value={activePlan.title} onChange={(e) => handlePlanChange('title', e.target.value)} className="text-2xl h-auto p-2 font-bold" disabled={isBuildingMode} /></div><div className="space-y-2"><Label htmlFor="courseDescription" className="font-semibold">Description</Label><Textarea id="courseDescription" value={activePlan.description} onChange={(e) => handlePlanChange('description', e.target.value)} disabled={isBuildingMode} /></div></div>
          <Accordion type="multiple" defaultValue={activePlan.chapters.map((_, i) => `item-${i}`)} className="w-full space-y-4">{activePlan.chapters.map((chapter, chapterIndex) => (<AccordionItem value={`item-${chapterIndex}`} key={chapterIndex} asChild><Card><div className="flex w-full items-start justify-between p-6"><div className="flex-1 space-y-2 pr-4"><Label htmlFor={`chapter-title-${chapterIndex}`} className="text-base font-semibold">Titre du Chapitre {chapterIndex + 1}</Label><div className="flex items-center gap-2"><Input id={`chapter-title-${chapterIndex}`} value={chapter.title} onChange={(e) => handleChapterChange(chapterIndex, 'title', e.target.value)} className="text-lg font-bold" disabled={isBuildingMode} /></div></div><AccordionTrigger disabled={isBuildingMode} /></div><AccordionContent><CardContent className="space-y-6 pl-6 pt-0"><div><h4 className="font-semibold flex items-center gap-2 mb-4"><BookCopy className="h-5 w-5 text-primary"/>Leçons</h4><div className="space-y-4">{chapter.lessons.map((lesson, lessonIndex) => (<div key={lessonIndex} className="flex gap-4 items-start pl-4 border-l-2 ml-2"><div className="flex-1 space-y-4"><div className="space-y-2"><Label htmlFor={`lesson-title-${chapterIndex}-${lessonIndex}`} className="text-sm font-semibold flex items-center gap-2"><BookCopy className="h-4 w-4"/> Titre & Objectif</Label><Input id={`lesson-title-${chapterIndex}-${lessonIndex}`} value={lesson.title} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'title', e.target.value)} placeholder="Titre de la leçon" disabled={isBuildingMode}/><Textarea value={lesson.objective} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'objective', e.target.value)} placeholder="Objectif de la leçon" rows={2} disabled={isBuildingMode}/></div></div></div>))}</div></div><Separator /><div><h4 className="font-semibold flex items-center gap-2 mb-4"><GraduationCap className="h-5 w-5 text-primary"/>Quiz</h4><div className="pl-4 space-y-4"><div className="space-y-2"><Label>Titre du Quiz: {chapter.quiz.title}</Label></div><div><Label className="text-sm font-semibold">Questions du quiz: {chapter.quiz.questions.length}</Label></div></div></div></CardContent></AccordionContent></Card></AccordionItem>))}</Accordion>
          <Separator />
          <div className="flex flex-wrap gap-4">
              <Button onClick={handleSavePlanAndRedirect} size="lg" variant="secondary" disabled={isSavingPlan || isCreatingCourse || isBuildingMode}>{isSavingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>} Sauvegarder le Plan</Button>
              <Button onClick={handleStartCourseBuild} size="lg" disabled={isSavingPlan || isCreatingCourse || isBuildingMode}>{isCreatingCourse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4"/>} Lancer la Création Détaillée</Button>
          </div>
      </div>
    );
    
    // === Render logic ===
    if (!isMounted) {
        return (
            <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-80" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-20 w-full" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-48" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/admin" className="hover:text-primary">Admin</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/admin/courses" className="hover:text-primary">Formations</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-semibold text-foreground">Créer</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-lg"><Wand2 className="h-8 w-8 text-primary" /></div>
                <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Créateur de Formation Assisté par IA</h1><p className="text-muted-foreground">Générez un plan de cours complet à partir d'un simple sujet.</p></div>
            </div>
            <Card>
                <CardHeader><CardTitle>1. Décrivez votre formation</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2"><Label htmlFor="topic">Sujet de la formation (obligatoire)</Label><Textarea id="topic" placeholder="Ex: Une introduction à Docker pour les développeurs web" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isBuildingMode}/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="audience">Public Cible (obligatoire)</Label><Input id="audience" placeholder="Ex: Débutants, Développeurs expérimentés" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} disabled={isBuildingMode}/></div><div className="space-y-2"><Label htmlFor="language">Langue de la formation (facultatif)</Label><Input id="language" placeholder="Ex: Français, English" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isBuildingMode}/></div></div>
                    <Card className="bg-muted/50 p-4"><CardDescription className="mb-4">Options avancées (facultatif)</CardDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2"><Label htmlFor="numChapters">Nombre de chapitres</Label><Input id="numChapters" type="number" placeholder="Ex: 8" value={numChapters} onChange={(e) => setNumChapters(e.target.value)} disabled={isBuildingMode}/></div>
                            <div className="space-y-2"><Label htmlFor="numLessons">Leçons par chapitre</Label><Input id="numLessons" type="number" placeholder="Ex: 5" value={numLessons} onChange={(e) => setNumLessons(e.target.value)} disabled={isBuildingMode}/></div>
                            <div className="space-y-2"><Label htmlFor="numQuestions">Questions par quiz</Label><Input id="numQuestions" type="number" placeholder="Ex: 4" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} disabled={isBuildingMode}/></div>
                            <div className="space-y-2">
                                <Label>Longueur des leçons</Label>
                                <RadioGroup value={lessonLength} onValueChange={(v) => setLessonLength(v as any)} className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Court" id="r-court" disabled={isBuildingMode}/><Label htmlFor="r-court">Courte</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Moyen" id="r-moyen" disabled={isBuildingMode}/><Label htmlFor="r-moyen">Moyenne</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Long" id="r-long" disabled={isBuildingMode}/><Label htmlFor="r-long">Longue</Label></div>
                                </RadioGroup>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-4 border-t">
                            <div className="flex items-center space-x-2"><Switch id="multiple-choice" checked={allowMultipleChoice} onCheckedChange={setAllowMultipleChoice} disabled={isBuildingMode}/><Label htmlFor="multiple-choice" className="cursor-pointer">Inclure des questions à choix multiples (QCM)</Label></div>
                            <div>
                                <Label>Affichage des réponses du quiz</Label>
                                <RadioGroup value={feedbackTiming} onValueChange={(value) => setFeedbackTiming(value as 'end' | 'immediate')} className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="end" id="r-end" disabled={isBuildingMode}/><Label htmlFor="r-end">À la fin</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="immediate" id="r-immediate" disabled={isBuildingMode}/><Label htmlFor="r-immediate">Après chaque question</Label></div>
                                </RadioGroup>
                            </div>
                        </div>
                    </Card>
                    <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan || isBuildingMode}>{isGeneratingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />} Générer le plan de formation</Button>
                    {error && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                </CardContent>
            </Card>
            {generatedPlans.length > 0 && (<Card className="mt-8"><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-6 w-6"/> Historique des Générations</CardTitle><CardDescription>Sélectionnez un plan pour le modifier ou le supprimer. Le plan actif est surligné.</CardDescription></CardHeader><CardContent className="space-y-2">{generatedPlans.filter(p => p && p.plan).map((storedPlan) => (<div key={storedPlan.localId} className={cn("p-3 rounded-md border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors", activePlanId === storedPlan.localId ? 'bg-primary/10 border-primary' : 'bg-muted/50')}><div><p className="font-semibold">{storedPlan.plan.title}</p><p className="text-sm text-muted-foreground">{storedPlan.plan.chapters.length} chapitres - Généré à {storedPlan.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></div><div className="flex gap-2 self-end sm:self-center"><Button variant="outline" size="sm" onClick={() => setActivePlanId(storedPlan.localId)} disabled={activePlanId === storedPlan.localId || isBuildingMode}><Pencil className="mr-2 h-4 w-4"/>Modifier</Button><Button variant="destructive" size="sm" onClick={() => handleDeletePlan(storedPlan.localId)} disabled={isBuildingMode}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</Button></div></div>))}</CardContent></Card>)}
            {(isGeneratingPlan || activePlan) && !isBuildingMode && (<Card className="mt-8"><CardHeader><CardTitle>2. Plan de Formation Actif</CardTitle><CardDescription>Vérifiez et modifiez le plan généré par l'IA avant de le sauvegarder.</CardDescription></CardHeader><CardContent>{isGeneratingPlan ? renderPlanLoadingState() : activePlan && renderEditablePlan()}</CardContent></Card>)}
            
            {isBuildingMode && (() => {
                const isBuildComplete = currentStepIndex >= buildSteps.length;
                return (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rocket className="h-6 w-6 text-primary" />
                                3. Atelier de Construction du Cours
                            </CardTitle>
                            <CardDescription>
                                {isBuildComplete 
                                    ? "Génération terminée ! La structure de votre cours et le contenu des leçons sont prêts."
                                    : "Suivez la génération du contenu, étape par étape. Les sections précédentes sont désactivées pendant ce processus."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
                                {/* Timeline */}
                                <Card><CardHeader><CardTitle>Progression</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[500px] pr-4">
                                        <div className="relative flex flex-col items-start">
                                            <div className="absolute left-3 top-2 h-full w-0.5 bg-border -translate-x-1/2"></div>
                                            {buildSteps.map((step, index) => {
                                                const isCompleted = index < currentStepIndex;
                                                const isCurrent = index === currentStepIndex;
                                                const Icon = isCompleted ? CheckCircle : (isCurrent ? (isBuilding ? Loader2 : CircleDashed) : CircleDashed);
                                                const color = isCompleted ? 'text-green-500' : (isCurrent ? 'text-primary' : 'text-muted-foreground');

                                                return (
                                                    <div key={index} className="relative flex items-center gap-4 mb-4 w-full">
                                                        <div className={cn("z-10 flex h-6 w-6 items-center justify-center rounded-full", isCompleted ? 'bg-green-500' : 'bg-background')}>
                                                            <Icon className={cn("h-4 w-4", isCompleted ? 'text-white' : color, isBuilding && 'animate-spin')} />
                                                        </div>
                                                        <div className={cn('font-medium text-sm', color)}>{step.title}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Content Preview & Controls */}
                                <Card className="flex flex-col"><CardHeader><CardTitle>Génération de Contenu IA</CardTitle><CardDescription>Validez chaque étape du processus.</CardDescription></CardHeader>
                                    <CardContent className="flex-1">
                                        <ScrollArea className="h-[450px] p-4 bg-muted/50 rounded-lg border">
                                            <AnimatePresence mode="wait">
                                            {isBuilding ? (
                                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                                    <p>L'IA rédige la leçon...</p>
                                                </motion.div>
                                            ) : generatedContent ? (
                                                 <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                                    {'illustrativeContent' in generatedContent && (
                                                        <div>
                                                            <h3 className="font-bold text-lg mb-2">Contenu Illustratif</h3>
                                                            <ReactMarkdown className="prose dark:prose-invert max-w-none" components={{ code({node, inline, className, children, ...props}) { return !inline ? (<CodeBlock className="my-4">{String(children).replace(/\n$/, '')}</CodeBlock>) : (<code className={className} {...props}>{children}</code>) } }}>
                                                                {generatedContent.illustrativeContent}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                    {generatedContent.interactiveComponentName && generatedContent.visualComponentName && (
                                                        <>
                                                            <Separator />
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <h3 className="font-bold text-lg mb-2">Composant Interactif Suggéré</h3>
                                                                    <Badge variant="secondary">{generatedContent.interactiveComponentName}</Badge>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-lg mb-2">Composant Visuel Suggéré</h3>
                                                                    <Badge variant="secondary">{generatedContent.visualComponentName}</Badge>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                 </motion.div>
                                            ) : isBuildComplete ? (
                                                 <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center">
                                                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                                    <h3 className="text-xl font-bold">Génération Terminée !</h3>
                                                    <p className="text-muted-foreground mt-2">La structure de votre cours et le contenu des leçons sont prêts.</p>
                                                </motion.div>
                                            ) : (
                                                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-full text-muted-foreground">
                                                    <p>En attente de la prochaine étape...</p>
                                                </motion.div>
                                            )}
                                            </AnimatePresence>
                                        </ScrollArea>
                                    </CardContent>
                                    <CardFooter>
                                        {isBuildComplete ? (
                                            <Button onClick={handleFinishBuild} size="lg" className="w-full">Terminer et aller à l'éditeur <Eye className="ml-2"/></Button>
                                        ) : (
                                            <Button onClick={handleBuildContinue} disabled={isBuilding} size="lg" className="w-full">
                                                {isBuilding ? <Loader2 className="animate-spin" /> : 'Continuer'}
                                                {!isBuilding && <ChevronRight />}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                );
            })()}
        </div>
    )
}

    

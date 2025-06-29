
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Wand2, BrainCircuit, Loader2, Save, AlertTriangle, Trash2, Pencil, History, ChevronRight, BookCopy, GraduationCap, PlusCircle
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { createCoursePlan, type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { savePlanAction } from '@/actions/courseActions';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type PlanWithId = CreateCourseOutput & { localId: string; createdAt: Date };


export default function CreateCoursePage() {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    // State for Create Course Tab
    const [topic, setTopic] = useState('');
    const [targetAudience, setTargetAudience] = useState('Débutants');
    const [numChapters, setNumChapters] = useState('');
    const [numLessons, setNumLessons] = useState('');
    const [numQuestions, setNumQuestions] = useState('');
    const [language, setLanguage] = useState('Français');
    const [allowMultipleChoice, setAllowMultipleChoice] = useState(true);
    const [feedbackTiming, setFeedbackTiming] = useState<'end' | 'immediate'>('end');
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    const [generatedPlans, setGeneratedPlans] = useLocalStorage<PlanWithId[]>('generatedCoursePlans', [], {
        deserializer: (value) => {
            try {
                const parsed = JSON.parse(value) as PlanWithId[];
                // Re-hydrate Date objects
                return parsed.map(plan => ({
                    ...plan,
                    createdAt: new Date(plan.createdAt),
                }));
            } catch {
                return [];
            }
        }
    });
    const [activePlanId, setActivePlanId] = useLocalStorage<string | null>('activeCoursePlanId', null);

    const [error, setError] = useState<string | null>(null);

    const activePlan = useMemo(() => generatedPlans.find(p => p.localId === activePlanId), [generatedPlans, activePlanId]);

    const handleGeneratePlan = async () => {
        if (!topic) {
            setError("Veuillez entrer un sujet pour la formation.");
            return;
        }
        if (!targetAudience) {
            setError("Veuillez préciser le public cible.");
            return;
        }
        setIsGeneratingPlan(true);
        setError(null);
        setActivePlanId(null);
        try {
            const plan = await createCoursePlan({ 
                topic, 
                targetAudience,
                numChapters: numChapters ? parseInt(numChapters, 10) : undefined,
                numLessonsPerChapter: numLessons ? parseInt(numLessons, 10) : undefined,
                numQuestionsPerQuiz: numQuestions ? parseInt(numQuestions, 10) : undefined,
                courseLanguage: language || undefined,
                allowMultipleChoice: allowMultipleChoice,
                feedbackTiming: feedbackTiming,
            });
            const newPlan: PlanWithId = { ...plan, localId: Date.now().toString(), createdAt: new Date() };
            setGeneratedPlans(prev => [newPlan, ...prev]);
            setActivePlanId(newPlan.localId);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la génération du plan. Veuillez réessayer.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };
    
    const handleSaveCourse = async () => {
        if (!activePlan) return;
        setIsSavingPlan(true);
        try {
            const generationParams: CreateCourseInput = {
                topic, 
                targetAudience,
                numChapters: numChapters ? parseInt(numChapters, 10) : undefined,
                numLessonsPerChapter: numLessons ? parseInt(numLessons, 10) : undefined,
                numQuestionsPerQuiz: numQuestions ? parseInt(numQuestions, 10) : undefined,
                courseLanguage: language || undefined,
                allowMultipleChoice: allowMultipleChoice,
                feedbackTiming: feedbackTiming,
            };
            await savePlanAction(activePlan, generationParams);
            toast({
                title: "Plan sauvegardé !",
                description: "Redirection vers la liste des formations...",
            });
            router.push(`/admin/courses`);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la sauvegarde du plan. Veuillez réessayer.");
            setIsSavingPlan(false);
        }
    };

    const updateActivePlan = (updater: (plan: PlanWithId) => PlanWithId) => {
        if (!activePlanId) return;
        setGeneratedPlans(prevPlans =>
            prevPlans.map(p => (p.localId === activePlanId ? updater(p) : p))
        );
    };
    const handlePlanChange = (field: 'title' | 'description', value: string) => updateActivePlan(plan => ({ ...plan, [field]: value }));
    const handleChapterChange = (chapterIndex: number, field: 'title', value: string) => {
        updateActivePlan(plan => {
            const newChapters = [...plan.chapters];
            newChapters[chapterIndex] = { ...newChapters[chapterIndex], [field]: value };
            return { ...plan, chapters: newChapters };
        });
    };
    const handleLessonChange = (chapterIndex: number, lessonIndex: number, field: keyof CreateCourseOutput['chapters'][0]['lessons'][0], value: string) => {
         updateActivePlan(plan => {
            const newChapters = [...plan.chapters];
            const newLessons = [...newChapters[chapterIndex].lessons];
            newLessons[lessonIndex] = { ...newLessons[lessonIndex], [field]: value };
            newChapters[chapterIndex] = { ...newChapters[chapterIndex], lessons: newLessons };
            return { ...plan, chapters: newChapters };
        });
    };
    const handleQuizTitleChange = (chapterIndex: number, value: string) => updateActivePlan(plan => { const newChapters = [...plan.chapters]; newChapters[chapterIndex].quiz.title = value; return { ...plan, chapters: newChapters }; });
    const handleQuestionChange = (chapterIndex: number, questionIndex: number, field: keyof CreateCourseOutput['chapters'][0]['quiz']['questions'][0], value: string | boolean) => {
      updateActivePlan(plan => { const newChapters = [...plan.chapters]; const newQuestions = [...newChapters[chapterIndex].quiz.questions]; (newQuestions[questionIndex] as any)[field] = value; newChapters[chapterIndex].quiz.questions = newQuestions; return { ...plan, chapters: newChapters }; });
    };
    const addChapter = () => updateActivePlan(plan => ({ ...plan, chapters: [...plan.chapters, { title: 'Nouveau Chapitre', lessons: [{ title: 'Nouvelle Leçon', objective: 'Objectif.' }], quiz: { title: 'Quiz', questions: [{ text: 'Question', answers: [{text: 'Réponse', isCorrect: true}], isMultipleChoice: false }], feedbackTiming: 'end' } }] }));
    const removeChapter = (chapterIndex: number) => updateActivePlan(plan => ({ ...plan, chapters: plan.chapters.filter((_, i) => i !== chapterIndex) }));
    const addLesson = (chapterIndex: number) => updateActivePlan(plan => { const newLesson = { title: 'Nouvelle Leçon', objective: 'Objectif.' }; const newChapters = [...plan.chapters]; newChapters[chapterIndex].lessons.push(newLesson); return { ...plan, chapters: newChapters }; });
    const removeLesson = (chapterIndex: number, lessonIndex: number) => updateActivePlan(plan => { const newChapters = [...plan.chapters]; newChapters[chapterIndex].lessons = newChapters[chapterIndex].lessons.filter((_, i) => i !== lessonIndex); return { ...plan, chapters: newChapters }; });
    const addQuizQuestion = (chapterIndex: number) => updateActivePlan(plan => { const newQuestion = { text: 'Question', answers: [{text: 'Réponse', isCorrect: true}], isMultipleChoice: false }; const newChapters = [...plan.chapters]; newChapters[chapterIndex].quiz.questions.push(newQuestion); return { ...plan, chapters: newChapters }; });
    const removeQuizQuestion = (chapterIndex: number, questionIndex: number) => updateActivePlan(plan => { const newChapters = [...plan.chapters]; newChapters[chapterIndex].quiz.questions = newChapters[chapterIndex].quiz.questions.filter((_, i) => i !== questionIndex); return { ...plan, chapters: newChapters }; });
    const handleDeletePlan = (idToDelete: string) => { setGeneratedPlans(prev => prev.filter(p => p.localId !== idToDelete)); if (activePlanId === idToDelete) { setActivePlanId(null); } };
    const renderPlanLoadingState = () => <div className="space-y-4 mt-6"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /><div className="space-y-2 pt-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></div>;
    const renderEditablePlan = () => activePlan && (
      <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-background p-6"><div className="space-y-2"><Label htmlFor="courseTitle" className="text-lg font-semibold">Titre de la Formation</Label><Input id="courseTitle" value={activePlan.title} onChange={(e) => handlePlanChange('title', e.target.value)} className="text-2xl h-auto p-2 font-bold" /></div><div className="space-y-2"><Label htmlFor="courseDescription" className="font-semibold">Description</Label><Textarea id="courseDescription" value={activePlan.description} onChange={(e) => handlePlanChange('description', e.target.value)} /></div></div>
          <Accordion type="multiple" defaultValue={activePlan.chapters.map((_, i) => `item-${i}`)} className="w-full space-y-4">
              {activePlan.chapters.map((chapter, chapterIndex) => (
                   <AccordionItem value={`item-${chapterIndex}`} key={chapterIndex} asChild>
                      <Card><div className="flex w-full items-start justify-between p-6"><div className="flex-1 space-y-2 pr-4"><Label htmlFor={`chapter-title-${chapterIndex}`} className="text-base font-semibold">Titre du Chapitre {chapterIndex + 1}</Label><div className="flex items-center gap-2"><Input id={`chapter-title-${chapterIndex}`} value={chapter.title} onChange={(e) => handleChapterChange(chapterIndex, 'title', e.target.value)} className="text-lg font-bold" /><Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button></div></div><div className="flex items-center"><Button variant="ghost" size="icon" onClick={() => removeChapter(chapterIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button><AccordionTrigger /></div></div>
                          <AccordionContent><CardContent className="space-y-6 pl-6 pt-0"><div><h4 className="font-semibold flex items-center gap-2 mb-4"><BookCopy className="h-5 w-5 text-primary"/>Leçons</h4><div className="space-y-4">{chapter.lessons.map((lesson, lessonIndex) => (<div key={lessonIndex} className="flex gap-4 items-start pl-4 border-l-2 ml-2"><Button variant="ghost" size="icon" className="mt-6"><Pencil className="h-4 w-4 text-muted-foreground"/></Button><div className="flex-1 space-y-4"><div className="space-y-2"><Label htmlFor={`lesson-title-${chapterIndex}-${lessonIndex}`} className="text-sm font-semibold flex items-center gap-2"><BookCopy className="h-4 w-4"/> Titre & Objectif</Label><Input id={`lesson-title-${chapterIndex}-${lessonIndex}`} value={lesson.title} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'title', e.target.value)} placeholder="Titre de la leçon" /><Textarea value={lesson.objective} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'objective', e.target.value)} placeholder="Objectif de la leçon" rows={2}/></div></div><Button variant="ghost" size="icon" onClick={() => removeLesson(chapterIndex, lessonIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>))}<Button variant="outline" size="sm" className="mt-4" onClick={() => addLesson(chapterIndex)}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter une leçon</Button></div></div><Separator />
                                  <div><h4 className="font-semibold flex items-center gap-2 mb-4"><GraduationCap className="h-5 w-5 text-primary"/>Quiz</h4><div className="pl-4 space-y-4"><div className="space-y-2"><Label htmlFor={`quiz-title-${chapterIndex}`} className="text-sm font-semibold">Titre du Quiz</Label><Input id={`quiz-title-${chapterIndex}`} value={chapter.quiz.title} onChange={(e) => handleQuizTitleChange(chapterIndex, e.target.value)} placeholder="Titre du quiz" /></div><div><Label className="text-sm font-semibold">Questions du quiz</Label><div className="space-y-2 mt-2">{chapter.quiz.questions.map((question, questionIndex) => (<div key={questionIndex} className="flex gap-2 items-center"><Textarea value={question.text} onChange={(e) => handleQuestionChange(chapterIndex, questionIndex, 'text', e.target.value)} placeholder="Texte de la question" /><Button variant="ghost" size="icon" onClick={() => removeQuizQuestion(chapterIndex, questionIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>))}<Button variant="outline" size="sm" className="mt-2" onClick={() => addQuizQuestion(chapterIndex)}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter une question</Button></div></div></div></div></CardContent></AccordionContent>
                      </Card>
                  </AccordionItem>
              ))}
          </Accordion>
          <Button onClick={addChapter} variant="secondary"><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un chapitre</Button><Separator /><Button onClick={handleSaveCourse} size="lg" disabled={isSavingPlan}>{isSavingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>} Sauvegarder le Plan Actif</Button>
      </div>
    );

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
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Créateur de Formation Assisté par IA</h1>
                  <p className="text-muted-foreground">Générez un plan de cours complet à partir d'un simple sujet.</p>
                </div>
              </div>
              <Card>
                <CardHeader><CardTitle>1. Décrivez votre formation</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2"><Label htmlFor="topic">Sujet de la formation (obligatoire)</Label><Textarea id="topic" placeholder="Ex: Une introduction à Docker pour les développeurs web" value={topic} onChange={(e) => setTopic(e.target.value)}/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="audience">Public Cible (obligatoire)</Label><Input id="audience" placeholder="Ex: Débutants, Développeurs expérimentés" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}/></div><div className="space-y-2"><Label htmlFor="language">Langue de la formation (facultatif)</Label><Input id="language" placeholder="Ex: Français, English" value={language} onChange={(e) => setLanguage(e.target.value)}/></div></div>
                    <Card className="bg-muted/50 p-4"><CardDescription className="mb-4">Options avancées (facultatif)</CardDescription><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="numChapters">Nombre de chapitres</Label><Input id="numChapters" type="number" placeholder="Ex: 8" value={numChapters} onChange={(e) => setNumChapters(e.target.value)}/></div><div className="space-y-2"><Label htmlFor="numLessons">Leçons par chapitre</Label><Input id="numLessons" type="number" placeholder="Ex: 5" value={numLessons} onChange={(e) => setNumLessons(e.target.value)}/></div><div className="space-y-2"><Label htmlFor="numQuestions">Questions par quiz</Label><Input id="numQuestions" type="number" placeholder="Ex: 4" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)}/></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-4 border-t"><div className="flex items-center space-x-2"><Switch id="multiple-choice" checked={allowMultipleChoice} onCheckedChange={setAllowMultipleChoice} /><Label htmlFor="multiple-choice" className="cursor-pointer">Inclure des questions à choix multiples (QCM)</Label></div><div><Label>Affichage des réponses du quiz</Label><RadioGroup value={feedbackTiming} onValueChange={(value) => setFeedbackTiming(value as 'end' | 'immediate')} className="flex items-center gap-4 mt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="end" id="r-end" /><Label htmlFor="r-end">À la fin</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="immediate" id="r-immediate" /><Label htmlFor="r-immediate">Après chaque question</Label></div></RadioGroup></div></div></Card>
                    <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan}>{isGeneratingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />} Générer le plan de formation</Button>
                    {error && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                </CardContent>
              </Card>
              {generatedPlans.length > 0 && (<Card className="mt-8"><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-6 w-6"/> Historique des Générations</CardTitle><CardDescription>Sélectionnez un plan pour le modifier ou le supprimer. Le plan actif est surligné.</CardDescription></CardHeader><CardContent className="space-y-2">{generatedPlans.map((plan) => (<div key={plan.localId} className={cn("p-3 rounded-md border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors", activePlanId === plan.localId ? 'bg-primary/10 border-primary' : 'bg-muted/50')}><div><p className="font-semibold">{plan.title}</p><p className="text-sm text-muted-foreground">{plan.chapters.length} chapitres - Généré à {plan.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></div><div className="flex gap-2 self-end sm:self-center"><Button variant="outline" size="sm" onClick={() => setActivePlanId(plan.localId)} disabled={activePlanId === plan.localId}><Pencil className="mr-2 h-4 w-4"/>Modifier</Button><Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.localId)}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</Button></div></div>))}</CardContent></Card>)}
              {(isGeneratingPlan || activePlan) && (<Card className="mt-8"><CardHeader><CardTitle>2. Plan de Formation Actif</CardTitle><CardDescription>Vérifiez et modifiez le plan généré par l'IA avant de le sauvegarder.</CardDescription></CardHeader><CardContent>{isGeneratingPlan ? renderPlanLoadingState() : activePlan && renderEditablePlan()}</CardContent></Card>)}
        </div>
    )
}

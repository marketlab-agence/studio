
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
import { savePlanAction, buildCourseFromPlanAction, generateLessonContentAction } from '@/actions/courseActions';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '@/components/ui/CodeBlock';
import type { GenerateLessonContentOutput } from '@/types/tutorial.types';
import { Badge } from '@/components/ui/badge';
import { useFormatter, useTranslations } from 'next-intl';


type StoredPlan = { plan: CreateCourseOutput; params: CreateCourseInput; localId: string; createdAt: Date };
type BuildStep = {
    type: 'lesson' | 'quiz';
    chapterIndex: number;
    lessonIndex?: number;
    title: string;
};

export default function CreateCoursePage() {
    const format = useFormatter();
    const t = useTranslations('admin');
    const tc = useTranslations('common');
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
    const [generatedContent, setGeneratedContent] = useState<GenerateLessonContentOutput | null>(null);
    
    // Mount state to prevent hydration errors
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Effect to load a plan from URL param on initial load
    useEffect(() => {
        const planIdToLoad = searchParams.get('planId');
        if (planIdToLoad) {
            const planFromStorage = generatedPlans.find(p => p.localId === planIdToLoad);
            if(planFromStorage) {
                setActivePlanId(planIdToLoad);
                setBuildingCourseId(planIdToLoad);
            }
        }
    }, [searchParams, generatedPlans, setActivePlanId]);


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
            setError(t('createCourse.errorTopicRequired'));
            return;
        }
        setIsGeneratingPlan(true);
        setError(null);
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
            setBuildingCourseId(null); // Reset building course ID for new plans
        } catch (e) {
            console.error(e);
            setError(t('createCourse.errorGeneratePlan'));
        } finally {
            setIsGeneratingPlan(false);
        }
    };
    
    const handleSavePlan = async () => {
        if (!activePlan || !activeStoredPlan) return;
        setIsSavingPlan(true);
        try {
            const { courseId } = await savePlanAction(activePlan, activeStoredPlan.params);
            const newStoredPlan = { ...activeStoredPlan, localId: courseId };
            
            setGeneratedPlans(prev => [newStoredPlan, ...prev.filter(p => p.localId !== activeStoredPlan.localId)]);
            setActivePlanId(newStoredPlan.localId);
            setBuildingCourseId(courseId); // Set the correct course ID after saving

            toast({ title: t('createCourse.planSavedTitle'), description: t('createCourse.planSavedDescription') });
        } catch (e) {
            console.error(e);
            setError(t('createCourse.errorSavePlan'));
        } finally {
            setIsSavingPlan(false);
        }
    };

    const handleStartCourseBuild = async () => {
        if (!activePlan || !activeStoredPlan) return;
        setIsCreatingCourse(true);
        setError(null);
    
        try {
            // Étape 1 : Sauvegarder le plan pour obtenir un ID de cours stable
            const { courseId } = await savePlanAction(activePlan, activeStoredPlan.params);
            const newStoredPlan = { ...activeStoredPlan, localId: courseId };
            setGeneratedPlans(prev => [newStoredPlan, ...prev.filter(p => p.localId !== activeStoredPlan.localId)]);
            setActivePlanId(newStoredPlan.localId);
            setBuildingCourseId(courseId);
    
            // Étape 2 : Construire la structure du cours
            await buildCourseFromPlanAction(courseId);
    
            // Étape 3 : Préparer les étapes pour la vue de l'atelier
            const steps: BuildStep[] = [];
            activePlan.chapters.forEach((chapter, chapterIndex) => {
                chapter.lessons.forEach((lesson, lessonIndex) => {
                    steps.push({ type: 'lesson', chapterIndex, lessonIndex, title: lesson.title });
                });
                steps.push({ type: 'quiz', chapterIndex, title: chapter.quiz.title });
            });
            setBuildSteps(steps);
            setCurrentStepIndex(0);
            
            // Étape 4 : Activer le mode construction
            setIsBuildingMode(true);
    
        } catch (e: any) {
            console.error(e);
            setError(e.message || t('createCourse.errorStartBuild'));
        } finally {
            setIsCreatingCourse(false);
        }
    };


    const handleBuildContinue = () => {
        setGeneratedContent(null);
        setCurrentStepIndex(prev => prev + 1);
    };

    const handleFinishBuild = () => {
        if (buildingCourseId) {
            router.push(`/admin/courses/${buildingCourseId}`);
        } else {
            router.push('/admin/courses');
        }
    };

    // Auto-trigger generation when step changes
    useEffect(() => {
        if (isBuildingMode && currentStepIndex < buildSteps.length && buildingCourseId) {
            const step = buildSteps[currentStepIndex];
            
            const generateStepContent = async () => {
                setIsBuilding(true);
                setGeneratedContent(null);
                try {
                    if (step.type === 'lesson' && typeof step.lessonIndex !== 'undefined') {
                        const result = await generateLessonContentAction(buildingCourseId, step.chapterIndex, step.lessonIndex);
                        setGeneratedContent(result);
                    } else if (step.type === 'quiz') {
                        setGeneratedContent({ illustrativeContent: t('createCourse.quizGeneratedContent', { title: step.title }) });
                    }
                } catch (e) {
                    setError(t('createCourse.errorGenerateContent'));
                    console.error(e);
                } finally {
                    setIsBuilding(false);
                }
            };
            generateStepContent();
        }
    }, [isBuildingMode, currentStepIndex, buildSteps, buildingCourseId, t]);


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
                          {t('createCourse.viewGenerationParams')}
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t-0 border rounded-b-md bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramTopic')}</p><p>{activeStoredPlan.params.topic}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramAudience')}</p><p>{activeStoredPlan.params.targetAudience}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramLanguage')}</p><p>{activeStoredPlan.params.courseLanguage || t('createCourse.paramLanguageDefault')}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramLessonLength')}</p><p>{activeStoredPlan.params.lessonLength || t('createCourse.paramLessonLengthDefault')}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramChapters')}</p><p>{activeStoredPlan.params.numChapters || t('createCourse.paramAuto')}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramLessonsPerChapter')}</p><p>{activeStoredPlan.params.numLessonsPerChapter || t('createCourse.paramAuto')}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramQuestionsPerQuiz')}</p><p>{activeStoredPlan.params.numQuestionsPerQuiz || t('createCourse.paramAuto')}</p></div>
                          <div className="space-y-1"><p className="font-semibold text-muted-foreground">{t('createCourse.paramQuizType')}</p><p>{activeStoredPlan.params.allowMultipleChoice ? t('createCourse.paramMultipleChoiceAllowed') : t('createCourse.paramSingleChoiceOnly')}</p></div>
                      </div>
                  </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <div className="space-y-4 rounded-lg border bg-background p-6"><div className="space-y-2"><Label htmlFor="courseTitle" className="text-lg font-semibold">{t('createCourse.courseTitleLabel')}</Label><Input id="courseTitle" value={activePlan.title} onChange={(e) => handlePlanChange('title', e.target.value)} className="text-2xl h-auto p-2 font-bold" disabled={isBuildingMode} /></div><div className="space-y-2"><Label htmlFor="courseDescription" className="font-semibold">{t('createCourse.courseDescriptionLabel')}</Label><Textarea id="courseDescription" value={activePlan.description} onChange={(e) => handlePlanChange('description', e.target.value)} disabled={isBuildingMode} /></div></div>
          <Accordion type="multiple" defaultValue={activePlan.chapters.map((_, i) => `item-${i}`)} className="w-full space-y-4">
            {activePlan.chapters.map((chapter, chapterIndex) => (
                <AccordionItem value={`item-${chapterIndex}`} key={chapterIndex} className="border-none">
                    <Card className="shadow-sm">
                        <AccordionTrigger className="p-6 text-left hover:no-underline w-full">
                            <div className="flex-1 space-y-2 pr-4">
                                <Label htmlFor={`chapter-title-${chapterIndex}`} className="text-base font-semibold cursor-pointer">{t('createCourse.chapterTitleLabel', { number: chapterIndex + 1 })}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id={`chapter-title-${chapterIndex}`}
                                        value={chapter.title}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleChapterChange(chapterIndex, 'title', e.target.value)}
                                        className="text-lg font-bold" disabled={isBuildingMode}
                                    />
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="space-y-6 pl-6 pt-0">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-4"><BookCopy className="h-5 w-5 text-primary"/>{t('createCourse.lessonsHeading')}</h4>
                                    <div className="space-y-4">
                                        {chapter.lessons.map((lesson, lessonIndex) => (
                                            <div key={lessonIndex} className="flex gap-4 items-start pl-4 border-l-2 ml-2">
                                                <div className="flex-1 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`lesson-title-${chapterIndex}-${lessonIndex}`} className="text-sm font-semibold flex items-center gap-2"><BookCopy className="h-4 w-4"/> {t('createCourse.lessonTitleObjective')}</Label>
                                                        <Input id={`lesson-title-${chapterIndex}-${lessonIndex}`} value={lesson.title} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'title', e.target.value)} placeholder={t('createCourse.lessonTitlePlaceholder')} disabled={isBuildingMode}/>
                                                        <Textarea value={lesson.objective} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'objective', e.target.value)} placeholder={t('createCourse.lessonObjectivePlaceholder')} rows={2} disabled={isBuildingMode}/>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-4"><GraduationCap className="h-5 w-5 text-primary"/>{t('createCourse.quizHeading')}</h4>
                                    <div className="pl-4 space-y-4">
                                        <div className="space-y-2"><Label>{t('createCourse.quizTitleLabel', { title: chapter.quiz.title })}</Label></div>
                                        <div><Label className="text-sm font-semibold">{t('createCourse.quizQuestionsLabel', { count: chapter.quiz.questions.length })}</Label></div>
                                    </div>
                                </div>
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            ))}
          </Accordion>
          <Separator />
          <div className="flex flex-wrap gap-4">
              <Button onClick={handleSavePlan} size="lg" variant="secondary" disabled={isSavingPlan || isCreatingCourse || isBuildingMode}>{isSavingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>} {t('createCourse.savePlan')}</Button>
              <Button onClick={handleStartCourseBuild} size="lg" disabled={isSavingPlan || isCreatingCourse || isBuildingMode}>{isCreatingCourse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4"/>} {t('createCourse.startBuild')}</Button>
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
                <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/admin/courses" className="hover:text-primary">{t('courses.title')}</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-semibold text-foreground">{t('createCourse.breadcrumbCreate')}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-lg"><Wand2 className="h-8 w-8 text-primary" /></div>
                <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('createCourse.pageTitle')}</h1><p className="text-muted-foreground">{t('createCourse.pageSubtitle')}</p></div>
            </div>
            <Card>
                <CardHeader><CardTitle>{t('createCourse.describeStepTitle')}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2"><Label htmlFor="topic">{t('createCourse.topicLabel')}</Label><Textarea id="topic" placeholder={t('createCourse.topicPlaceholder')} value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isBuildingMode} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="audience">{t('createCourse.audienceLabel')}</Label><Input id="audience" placeholder={t('createCourse.audiencePlaceholder')} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} disabled={isBuildingMode}/></div><div className="space-y-2"><Label htmlFor="language">{t('createCourse.languageLabel')}</Label><Input id="language" placeholder={t('createCourse.languagePlaceholder')} value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isBuildingMode}/></div></div>
                    <Card className="bg-muted/50 p-4"><CardDescription className="mb-4">{t('createCourse.advancedOptions')}</CardDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2"><Label htmlFor="numChapters">{t('createCourse.numChaptersLabel')}</Label><Input id="numChapters" type="number" placeholder={t('createCourse.numChaptersPlaceholder')} value={numChapters} onChange={(e) => setNumChapters(e.target.value)} disabled={isBuildingMode}/></div>
                            <div className="space-y-2"><Label htmlFor="numLessons">{t('createCourse.numLessonsLabel')}</Label><Input id="numLessons" type="number" placeholder={t('createCourse.numLessonsPlaceholder')} value={numLessons} onChange={(e) => setNumLessons(e.target.value)} disabled={isBuildingMode}/></div>
                            <div className="space-y-2"><Label htmlFor="numQuestions">{t('createCourse.numQuestionsLabel')}</Label><Input id="numQuestions" type="number" placeholder={t('createCourse.numQuestionsPlaceholder')} value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} disabled={isBuildingMode}/></div>
                            <div className="space-y-2">
                                <Label>{t('createCourse.lessonLengthLabel')}</Label>
                                <RadioGroup value={lessonLength} onValueChange={(v) => setLessonLength(v as any)} className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Court" id="r-court" disabled={isBuildingMode}/><Label htmlFor="r-court">{t('createCourse.lessonLengthShort')}</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Moyen" id="r-moyen" disabled={isBuildingMode}/><Label htmlFor="r-moyen">{t('createCourse.lessonLengthMedium')}</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Long" id="r-long" disabled={isBuildingMode}/><Label htmlFor="r-long">{t('createCourse.lessonLengthLong')}</Label></div>
                                </RadioGroup>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-4 border-t">
                            <div className="flex items-center space-x-2"><Switch id="multiple-choice" checked={allowMultipleChoice} onCheckedChange={setAllowMultipleChoice} disabled={isBuildingMode}/><Label htmlFor="multiple-choice" className="cursor-pointer">{t('createCourse.allowMultipleChoice')}</Label></div>
                            <div>
                                <Label>{t('createCourse.feedbackTimingLabel')}</Label>
                                <RadioGroup value={feedbackTiming} onValueChange={(value) => setFeedbackTiming(value as 'end' | 'immediate')} className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="end" id="r-end" disabled={isBuildingMode}/><Label htmlFor="r-end">{t('quiz.feedbackEnd')}</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="immediate" id="r-immediate" disabled={isBuildingMode}/><Label htmlFor="r-immediate">{t('quiz.feedbackImmediate')}</Label></div>
                                </RadioGroup>
                            </div>
                        </div>
                    </Card>
                    <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan || isBuildingMode}>{isGeneratingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />} {t('createCourse.generatePlan')}</Button>
                    {error && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{tc('errorTitle')}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                </CardContent>
            </Card>
            {generatedPlans.length > 0 && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History className="h-6 w-6"/> {t('createCourse.historyTitle')}</CardTitle>
                        <CardDescription>{t('createCourse.historyDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {generatedPlans.filter(p => p && p.plan).map((storedPlan) => (
                            <div key={storedPlan.localId} className={cn("p-3 rounded-md border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors", activePlanId === storedPlan.localId ? 'bg-primary/10 border-primary' : 'bg-muted/50')}>
                                <div>
                                    <p className="font-semibold">{storedPlan.plan.title}</p>
                                    <p className="text-sm text-muted-foreground">{t('createCourse.chaptersGeneratedAt', { count: storedPlan.plan.chapters.length, time: format.dateTime(storedPlan.createdAt, { hour: '2-digit', minute: '2-digit' }) })}</p>
                                </div>
                                <div className="flex gap-2 self-end sm:self-center">
                                    <Button variant="outline" size="sm" onClick={() => setActivePlanId(storedPlan.localId)} disabled={activePlanId === storedPlan.localId || isBuildingMode}><Pencil className="mr-2 h-4 w-4"/>{t('edit')}</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(storedPlan.localId)} disabled={isBuildingMode}><Trash2 className="mr-2 h-4 w-4"/>{t('deleteCourse.trigger')}</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
            {(isGeneratingPlan || activePlan) && !isBuildingMode && (<Card className="mt-8"><CardHeader><CardTitle>{t('createCourse.activePlanStepTitle')}</CardTitle><CardDescription>{t('createCourse.activePlanDescription')}</CardDescription></CardHeader><CardContent>{isGeneratingPlan ? renderPlanLoadingState() : activePlan && renderEditablePlan()}</CardContent></Card>)}
            
            {isBuildingMode && (() => {
                const isBuildComplete = currentStepIndex >= buildSteps.length;
                return (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rocket className="h-6 w-6 text-primary" />
                                {t('createCourse.buildStepTitle')}
                            </CardTitle>
                            <CardDescription>
                                {isBuildComplete 
                                    ? t('createCourse.buildCompleteDescription')
                                    : t('createCourse.buildInProgressDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
                                {/* Timeline */}
                                <Card><CardHeader><CardTitle>{t('createCourse.progressTitle')}</CardTitle></CardHeader>
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
                                <Card className="flex flex-col"><CardHeader><CardTitle>{t('createCourse.contentGenerationTitle')}</CardTitle><CardDescription>{t('createCourse.contentGenerationDescription')}</CardDescription></CardHeader>
                                    <CardContent className="flex-1">
                                        <ScrollArea className="h-[450px] p-4 bg-muted/50 rounded-lg border">
                                            <AnimatePresence mode="wait">
                                            {isBuilding ? (
                                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                                    <p>{t('createCourse.aiWriting')}</p>
                                                </motion.div>
                                            ) : generatedContent ? (
                                                 <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                                    {'illustrativeContent' in generatedContent && (
                                                        <div>
                                                            <h3 className="font-bold text-lg mb-2">{t('createCourse.illustrativeContentTitle')}</h3>
                                                            <ReactMarkdown className="prose dark:prose-invert max-w-none" components={{ code({node, className, children, ...props}) { const isBlock = /language-(\w+)/.test(className || '') || String(children).includes('\n'); return isBlock ? (<CodeBlock className="my-4">{String(children).replace(/\n$/, '')}</CodeBlock>) : (<code className={className} {...props}>{children}</code>) } }}>
                                                                {generatedContent.illustrativeContent}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                    {(generatedContent.interactiveComponentName || generatedContent.visualComponentName) && (
                                                        <>
                                                            <Separator />
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {generatedContent.interactiveComponentName && (
                                                                    <div>
                                                                        <h3 className="font-bold text-lg mb-2">{t('createCourse.suggestedInteractiveComponent')}</h3>
                                                                        <Badge variant="secondary">{generatedContent.interactiveComponentName}</Badge>
                                                                    </div>
                                                                )}
                                                                {generatedContent.visualComponentName && (
                                                                    <div>
                                                                        <h3 className="font-bold text-lg mb-2">{t('createCourse.suggestedVisualComponent')}</h3>
                                                                        <Badge variant="secondary">{generatedContent.visualComponentName}</Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                 </motion.div>
                                            ) : isBuildComplete ? (
                                                 <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center">
                                                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                                    <h3 className="text-xl font-bold">{t('createCourse.generationCompleteTitle')}</h3>
                                                    <p className="text-muted-foreground mt-2">{t('createCourse.generationCompleteDescription')}</p>
                                                </motion.div>
                                            ) : (
                                                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-full text-muted-foreground">
                                                    <p>{t('createCourse.waitingNextStep')}</p>
                                                </motion.div>
                                            )}
                                            </AnimatePresence>
                                        </ScrollArea>
                                    </CardContent>
                                    <CardFooter>
                                        {isBuildComplete ? (
                                            <Button onClick={handleFinishBuild} size="lg" className="w-full">{t('createCourse.finishAndOpenEditor')} <Eye className="ml-2"/></Button>
                                        ) : (
                                            <Button onClick={handleBuildContinue} disabled={isBuilding} size="lg" className="w-full">
                                                {isBuilding ? <Loader2 className="animate-spin" /> : t('createCourse.continue')}
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

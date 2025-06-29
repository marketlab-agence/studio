
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Wand2, Loader2, BookOpen, GraduationCap, Save, AlertTriangle, Trash2, PlusCircle, Pencil, Puzzle, BookCopy } from 'lucide-react';
import { createCoursePlan, type CreateCourseOutput, type CreateCourseInput } from '@/ai/flows/create-course-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { savePlanAction } from '@/actions/courseActions';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';

export default function CreateCoursePage() {
    const [topic, setTopic] = useState('');
    const [targetAudience, setTargetAudience] = useState('Débutants');
    const [numChapters, setNumChapters] = useState('');
    const [numLessons, setNumLessons] = useState('');
    const [numQuestions, setNumQuestions] = useState('');
    const [language, setLanguage] = useState('Français');
    const [allowMultipleChoice, setAllowMultipleChoice] = useState(true);
    const [feedbackTiming, setFeedbackTiming] = useState<'end' | 'immediate'>('end');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [coursePlan, setCoursePlan] = useState<CreateCourseOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleGeneratePlan = async () => {
        if (!topic) {
            setError("Veuillez entrer un sujet pour la formation.");
            return;
        }
        if (!targetAudience) {
            setError("Veuillez préciser le public cible.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setCoursePlan(null);
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
            setCoursePlan(plan);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la génération du plan. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveCourse = async () => {
        if (!coursePlan) return;
        setIsSaving(true);
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
            await savePlanAction(coursePlan, generationParams);
            toast({
                title: "Plan sauvegardé !",
                description: "Redirection vers la liste des formations...",
            });
            router.push(`/admin/courses`);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la sauvegarde du plan. Veuillez réessayer.");
            setIsSaving(false);
        }
    };

    const handlePlanChange = (field: 'title' | 'description', value: string) => {
        setCoursePlan(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleChapterChange = (chapterIndex: number, field: 'title', value: string) => {
        if (!coursePlan) return;
        const newChapters = [...coursePlan.chapters];
        newChapters[chapterIndex] = { ...newChapters[chapterIndex], [field]: value };
        setCoursePlan({ ...coursePlan, chapters: newChapters });
    };

    const handleLessonChange = (chapterIndex: number, lessonIndex: number, field: keyof CreateCourseOutput['chapters'][0]['lessons'][0], value: string) => {
        if (!coursePlan) return;
        const newChapters = [...coursePlan.chapters];
        const newLessons = [...newChapters[chapterIndex].lessons];
        newLessons[lessonIndex] = { ...newLessons[lessonIndex], [field]: value };
        newChapters[chapterIndex] = { ...newChapters[chapterIndex], lessons: newLessons };
        setCoursePlan({ ...coursePlan, chapters: newChapters });
    };
    
    const handleQuizTitleChange = (chapterIndex: number, value: string) => {
        if (!coursePlan) return;
        const newChapters = [...coursePlan.chapters];
        newChapters[chapterIndex].quiz.title = value;
        setCoursePlan({ ...coursePlan, chapters: newChapters });
    };

    const handleQuestionChange = (chapterIndex: number, questionIndex: number, field: keyof CreateCourseOutput['chapters'][0]['quiz']['questions'][0], value: string | boolean) => {
      if (!coursePlan) return;
      const newChapters = [...coursePlan.chapters];
      const newQuestions = [...newChapters[chapterIndex].quiz.questions];
      (newQuestions[questionIndex] as any)[field] = value;
      newChapters[chapterIndex].quiz.questions = newQuestions;
      setCoursePlan({ ...coursePlan, chapters: newChapters });
    };

    const addChapter = () => {
        if (!coursePlan) return;
        const newChapter = {
            title: 'Nouveau Chapitre',
            lessons: [{ title: 'Nouvelle Leçon', objective: 'Objectif de la nouvelle leçon.' }],
            quiz: { 
                title: 'Quiz du nouveau chapitre', 
                questions: [{ 
                    text: 'Nouvelle question', 
                    answers: [{text: 'Réponse correcte', isCorrect: true}, {text: 'Réponse incorrecte', isCorrect: false}],
                    isMultipleChoice: false
                }],
                feedbackTiming: 'end' as 'end' | 'immediate'
            }
        };
        setCoursePlan({ ...coursePlan, chapters: [...coursePlan.chapters, newChapter] });
    };
    
    const removeChapter = (chapterIndex: number) => {
        if (!coursePlan) return;
        setCoursePlan({ ...coursePlan, chapters: coursePlan.chapters.filter((_, i) => i !== chapterIndex) });
    };
    
    const addLesson = (chapterIndex: number) => {
        if (!coursePlan) return;
        const newLesson = { title: 'Nouvelle Leçon', objective: 'Objectif de la nouvelle leçon.' };
        const newChapters = [...coursePlan.chapters];
        newChapters[chapterIndex].lessons.push(newLesson);
        setCoursePlan({ ...coursePlan, chapters: newChapters });
    };
    
    const removeLesson = (chapterIndex: number, lessonIndex: number) => {
        if (!coursePlan) return;
        const newChapters = [...coursePlan.chapters];
        newChapters[chapterIndex].lessons = newChapters[chapterIndex].lessons.filter((_, i) => i !== lessonIndex);
        setCoursePlan({ ...coursePlan, chapters: newChapters });
    };
    
    const addQuizQuestion = (chapterIndex: number) => {
        if (!coursePlan) return;
        const newQuestion = { 
            text: 'Nouvelle question', 
            answers: [{text: 'Réponse A', isCorrect: true}, {text: 'Réponse B', isCorrect: false}],
            isMultipleChoice: false
        };
        const newChapters = [...coursePlan.chapters];
        newChapters[chapterIndex].quiz.questions.push(newQuestion);
        setCoursePlan({ ...coursePlan, chapters: newChapters });
    };

    const removeQuizQuestion = (chapterIndex: number, questionIndex: number) => {
        if (!coursePlan) return;
        const newChapters = [...coursePlan.chapters];
        newChapters[chapterIndex].quiz.questions = newChapters[chapterIndex].quiz.questions.filter((_, i) => i !== questionIndex);
        setCoursePlan({ ...coursePlan, chapters: newChapters });
    };

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
    );
    
    const renderEditablePlan = () => coursePlan && (
      <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-background p-6">
              <div className="space-y-2">
                  <Label htmlFor="courseTitle" className="text-lg font-semibold">Titre de la Formation</Label>
                  <Input id="courseTitle" value={coursePlan.title} onChange={(e) => handlePlanChange('title', e.target.value)} className="text-2xl h-auto p-2 font-bold" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="courseDescription" className="font-semibold">Description</Label>
                  <Textarea id="courseDescription" value={coursePlan.description} onChange={(e) => handlePlanChange('description', e.target.value)} />
              </div>
          </div>

          <Accordion type="multiple" defaultValue={coursePlan.chapters.map((_, i) => `item-${i}`)} className="w-full space-y-4">
              {coursePlan.chapters.map((chapter, chapterIndex) => (
                   <AccordionItem value={`item-${chapterIndex}`} key={chapterIndex} asChild>
                      <Card>
                          <div className="flex w-full items-start justify-between p-6">
                              <div className="flex-1 space-y-2 pr-4">
                                  <Label htmlFor={`chapter-title-${chapterIndex}`} className="text-base font-semibold">Titre du Chapitre {chapterIndex + 1}</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                        id={`chapter-title-${chapterIndex}`}
                                        value={chapter.title}
                                        onChange={(e) => handleChapterChange(chapterIndex, 'title', e.target.value)}
                                        className="text-lg font-bold"
                                    />
                                     <Button variant="ghost" size="icon">
                                          <Pencil className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                  </div>
                              </div>
                              <div className="flex items-center">
                                  <Button variant="ghost" size="icon" onClick={() => removeChapter(chapterIndex)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                  <AccordionTrigger />
                              </div>
                          </div>

                          <AccordionContent>
                              <CardContent className="space-y-6 pl-6 pt-0">
                                  {/* Lessons */}
                                  <div>
                                      <h4 className="font-semibold flex items-center gap-2 mb-4"><BookOpen className="h-5 w-5 text-primary"/>Leçons</h4>
                                      <div className="space-y-4">
                                          {chapter.lessons.map((lesson, lessonIndex) => (
                                              <div key={lessonIndex} className="flex gap-4 items-start pl-4 border-l-2 ml-2">
                                                <Button variant="ghost" size="icon" className="mt-6"><Pencil className="h-4 w-4 text-muted-foreground"/></Button>
                                                  <div className="flex-1 space-y-4">
                                                      <div className="space-y-2">
                                                        <Label htmlFor={`lesson-title-${chapterIndex}-${lessonIndex}`} className="text-sm font-semibold flex items-center gap-2"><BookCopy className="h-4 w-4"/> Titre & Objectif</Label>
                                                        <Input id={`lesson-title-${chapterIndex}-${lessonIndex}`} value={lesson.title} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'title', e.target.value)} placeholder="Titre de la leçon" />
                                                        <Textarea value={lesson.objective} onChange={(e) => handleLessonChange(chapterIndex, lessonIndex, 'objective', e.target.value)} placeholder="Objectif de la leçon" rows={2}/>
                                                      </div>
                                                  </div>
                                                  <Button variant="ghost" size="icon" onClick={() => removeLesson(chapterIndex, lessonIndex)}>
                                                      <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                              </div>
                                          ))}
                                      </div>
                                      <Button variant="outline" size="sm" className="mt-4" onClick={() => addLesson(chapterIndex)}>
                                          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une leçon
                                      </Button>
                                  </div>

                                  <Separator />

                                  {/* Quiz */}
                                  <div>
                                      <h4 className="font-semibold flex items-center gap-2 mb-4"><GraduationCap className="h-5 w-5 text-primary"/>Quiz</h4>
                                      <div className="pl-4 space-y-4">
                                         <div className="space-y-2">
                                              <Label htmlFor={`quiz-title-${chapterIndex}`} className="text-sm font-semibold">Titre du Quiz</Label>
                                              <Input id={`quiz-title-${chapterIndex}`} value={chapter.quiz.title} onChange={(e) => handleQuizTitleChange(chapterIndex, e.target.value)} placeholder="Titre du quiz" />
                                         </div>
                                         <div>
                                              <Label className="text-sm font-semibold">Questions du quiz</Label>
                                              <div className="space-y-2 mt-2">
                                                  {chapter.quiz.questions.map((question, questionIndex) => (
                                                      <div key={questionIndex} className="flex gap-2 items-center">
                                                          <Textarea value={question.text} onChange={(e) => handleQuestionChange(chapterIndex, questionIndex, 'text', e.target.value)} placeholder="Texte de la question" />
                                                          <Button variant="ghost" size="icon" onClick={() => removeQuizQuestion(chapterIndex, questionIndex)}>
                                                              <Trash2 className="h-4 w-4 text-destructive" />
                                                          </Button>
                                                      </div>
                                                  ))}
                                              </div>
                                              <Button variant="outline" size="sm" className="mt-2" onClick={() => addQuizQuestion(chapterIndex)}>
                                                  <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une question
                                              </Button>
                                         </div>
                                      </div>
                                  </div>
                              </CardContent>
                          </AccordionContent>
                      </Card>
                  </AccordionItem>
              ))}
          </Accordion>
          
          <Button onClick={addChapter} variant="secondary">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un chapitre
          </Button>

          <Separator />
          
          <Button onClick={handleSaveCourse} size="lg" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
              Sauvegarder le Plan
          </Button>
      </div>
  );
    
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
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="topic">Sujet de la formation (obligatoire)</Label>
                <Textarea 
                    id="topic"
                    placeholder="Ex: Une introduction à Docker pour les développeurs web" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="audience">Public Cible (obligatoire)</Label>
                    <Input 
                        id="audience"
                        placeholder="Ex: Débutants, Développeurs expérimentés" 
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="language">Langue de la formation (facultatif)</Label>
                    <Input 
                        id="language"
                        placeholder="Ex: Français, English" 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    />
                </div>
            </div>

            <Card className="bg-muted/50 p-4">
                <CardDescription className="mb-4">Options avancées (facultatif)</CardDescription>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="numChapters">Nombre de chapitres</Label>
                        <Input 
                            id="numChapters"
                            type="number"
                            placeholder="Ex: 8"
                            value={numChapters}
                            onChange={(e) => setNumChapters(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="numLessons">Leçons par chapitre</Label>
                        <Input 
                            id="numLessons"
                            type="number"
                            placeholder="Ex: 5"
                            value={numLessons}
                            onChange={(e) => setNumLessons(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="numQuestions">Questions par quiz</Label>
                        <Input 
                            id="numQuestions"
                            type="number"
                            placeholder="Ex: 4"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(e.target.value)}
                        />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-4 border-t">
                    <div className="flex items-center space-x-2">
                        <Switch id="multiple-choice" checked={allowMultipleChoice} onCheckedChange={setAllowMultipleChoice} />
                        <Label htmlFor="multiple-choice" className="cursor-pointer">
                            Inclure des questions à choix multiples (QCM)
                        </Label>
                    </div>
                    <div>
                        <Label>Affichage des réponses du quiz</Label>
                        <RadioGroup value={feedbackTiming} onValueChange={(value) => setFeedbackTiming(value as 'end' | 'immediate')} className="flex items-center gap-4 mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="end" id="r-end" />
                                <Label htmlFor="r-end">À la fin</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="immediate" id="r-immediate" />
                                <Label htmlFor="r-immediate">Après chaque question</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </Card>

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
                 <CardDescription>Vérifiez et modifiez le plan généré par l'IA avant de le sauvegarder.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? renderLoadingState() : coursePlan && renderEditablePlan()}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

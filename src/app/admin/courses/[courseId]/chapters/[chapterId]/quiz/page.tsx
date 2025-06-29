
'use client';

import { useState, useEffect } from 'react';
import { QUIZZES } from '@/lib/quiz';
import { notFound, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Save, GraduationCap, Loader2, PlusCircle, Trash2, Check, GripVertical } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Quiz, Question, Answer } from '@/types/tutorial.types';
import { Skeleton } from '@/components/ui/skeleton';
import { TUTORIALS } from '@/lib/tutorials';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

export default function EditQuizPage() {
  const params = useParams();
  const { courseId, chapterId } = params as { courseId: string; chapterId: string; };
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const chapter = TUTORIALS.find(c => c.id === chapterId);
    const quizData = QUIZZES[chapterId];
    
    if (quizData && chapter) {
      setQuiz(JSON.parse(JSON.stringify(quizData)));
      setChapterTitle(chapter.title);
    }
    setIsLoading(false);
  }, [chapterId]);
  
  const handleQuizChange = (field: keyof Quiz, value: any) => {
    setQuiz(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    setQuiz(prev => {
        if (!prev) return null;
        const newQuestions = [...prev.questions];
        newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
        return { ...prev, questions: newQuestions };
    });
  };

  const handleAnswerChange = (qIndex: number, aIndex: number, field: keyof Answer, value: any) => {
     setQuiz(prev => {
        if (!prev) return null;
        const newQuestions = [...prev.questions];
        const newAnswers = [...newQuestions[qIndex].answers];
        newAnswers[aIndex] = { ...newAnswers[aIndex], [field]: value };
        newQuestions[qIndex] = { ...newQuestions[qIndex], answers: newAnswers };
        return { ...prev, questions: newQuestions };
    });
  };

  const addQuestion = () => {
    setQuiz(prev => {
      if (!prev) return null;
      const newQuestion: Question = {
        id: `${chapterId}-q${Date.now()}`,
        text: 'Nouvelle question',
        answers: [{id: `${chapterId}-q${Date.now()}-a1`, text: 'Réponse correcte', isCorrect: true}],
        isMultipleChoice: false
      };
      return {...prev, questions: [...prev.questions, newQuestion]};
    });
  };

  const removeQuestion = (qIndex: number) => {
    setQuiz(prev => {
      if (!prev) return null;
      const newQuestions = prev.questions.filter((_, i) => i !== qIndex);
      return {...prev, questions: newQuestions};
    });
  };
  
  const addAnswer = (qIndex: number) => {
    setQuiz(prev => {
        if (!prev) return null;
        const newQuestions = [...prev.questions];
        const newAnswer: Answer = { id: `${newQuestions[qIndex].id}-a${Date.now()}`, text: 'Nouvelle réponse', isCorrect: false };
        newQuestions[qIndex].answers.push(newAnswer);
        return {...prev, questions: newQuestions};
    });
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
     setQuiz(prev => {
        if (!prev) return null;
        const newQuestions = [...prev.questions];
        const newAnswers = newQuestions[qIndex].answers.filter((_, i) => i !== aIndex);
        newQuestions[qIndex] = {...newQuestions[qIndex], answers: newAnswers};
        return {...prev, questions: newQuestions};
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    if (quiz) {
      QUIZZES[chapterId] = quiz;
    }
    setTimeout(() => {
        toast({
            title: 'Quiz Sauvegardé',
            description: `Le quiz pour "${chapterTitle}" a été mis à jour (simulation).`,
        });
        setIsSaving(false);
    }, 1000);
  };
  
  if (isLoading) {
      return (
        <div className="space-y-6">
            <Skeleton className="h-6 w-1/2" />
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2"><Skeleton className="h-8 w-60" /><Skeleton className="h-4 w-40" /></div>
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card><CardContent className="p-6 space-y-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
        </div>
      );
  }

  if (!quiz) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}`} className="hover:text-primary">Formation</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}/chapters/${chapterId}`} className="hover:text-primary max-w-xs truncate">{chapterTitle}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground truncate max-w-xs">Modifier le Quiz</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg"><GraduationCap className="h-8 w-8 text-primary" /></div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Éditeur de Quiz</h1>
                <p className="text-muted-foreground">Chapitre: {chapterTitle}</p>
            </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
           <div className="space-y-2">
                <Label htmlFor="quizTitle">Titre du Quiz</Label>
                <Input id="quizTitle" value={quiz.title} onChange={(e) => handleQuizChange('title', e.target.value)} />
            </div>
            <div>
                <Label>Affichage des réponses</Label>
                 <RadioGroup value={quiz.feedbackTiming} onValueChange={(value) => handleQuizChange('feedbackTiming', value as 'end' | 'immediate')} className="flex items-center gap-4 mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="end" id="r-end" /><Label htmlFor="r-end">À la fin</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="immediate" id="r-immediate" /><Label htmlFor="r-immediate">Après chaque question</Label></div>
                </RadioGroup>
            </div>
        </CardContent>
      </Card>

      <Separator />

        <h2 className="text-xl font-bold">Questions</h2>
        {quiz.questions.map((q, qIndex) => (
            <Card key={q.id}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-lg">Question {qIndex + 1}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`q-text-${q.id}`}>Texte de la question</Label>
                        <Textarea id={`q-text-${q.id}`} value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} />
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`q-multi-${q.id}`} checked={q.isMultipleChoice} onCheckedChange={(checked) => handleQuestionChange(qIndex, 'isMultipleChoice', checked)} />
                        <Label htmlFor={`q-multi-${q.id}`}>Permettre les choix multiples</Label>
                    </div>
                    
                    <Separator />
                    <Label>Réponses</Label>
                    <div className="space-y-2">
                        {q.answers.map((a, aIndex) => (
                             <div key={a.id} className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="cursor-grab"><GripVertical className="h-4 w-4" /></Button>
                                <Input value={a.text} onChange={(e) => handleAnswerChange(qIndex, aIndex, 'text', e.target.value)} placeholder={`Texte de la réponse ${aIndex + 1}`} />
                                <div className="flex items-center gap-2 p-2 border rounded-md">
                                    <input type="checkbox" id={`a-correct-${a.id}`} checked={a.isCorrect} onChange={(e) => handleAnswerChange(qIndex, aIndex, 'isCorrect', e.target.checked)}/>
                                    <Label htmlFor={`a-correct-${a.id}`}>Correcte ?</Label>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeAnswer(qIndex, aIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                             </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addAnswer(qIndex)}><PlusCircle className="mr-2 h-4 w-4"/> Ajouter une réponse</Button>
                </CardContent>
            </Card>
        ))}
         <Button onClick={addQuestion}><PlusCircle className="mr-2 h-4 w-4"/> Ajouter une question</Button>
    </div>
  );
}

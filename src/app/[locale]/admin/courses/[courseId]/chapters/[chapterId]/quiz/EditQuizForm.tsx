
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Save, GraduationCap, Loader2, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Quiz, Question, Answer } from '@/types/tutorial.types';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { updateQuizAction } from '@/actions/courseActions';
import { useTranslations } from 'next-intl';

interface EditQuizFormProps {
    initialQuiz: Quiz;
    initialChapterTitle: string;
    courseId: string;
    chapterId: string;
}

export function EditQuizForm({ initialQuiz, initialChapterTitle, courseId, chapterId }: EditQuizFormProps) {
  const { toast } = useToast();
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleQuizChange = (field: keyof Quiz, value: any) => {
    setQuiz(prev => ({ ...prev, [field]: value }));
  };
  
  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    setQuiz(prev => {
        const newQuestions = [...prev.questions];
        newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
        return { ...prev, questions: newQuestions };
    });
  };

  const handleAnswerChange = (qIndex: number, aIndex: number, field: keyof Answer, value: any) => {
     setQuiz(prev => {
        const newQuestions = [...prev.questions];
        const newAnswers = [...newQuestions[qIndex].answers];
        newAnswers[aIndex] = { ...newAnswers[aIndex], [field]: value };
        newQuestions[qIndex] = { ...newQuestions[qIndex], answers: newAnswers };
        return { ...prev, questions: newQuestions };
    });
  };

  const addQuestion = () => {
    setQuiz(prev => {
      const questionId = `${chapterId}-q${Date.now()}`;
      const newQuestion: Question = {
        id: questionId,
        text: t('quiz.newQuestion'),
        answers: [{id: `${questionId}-a1`, text: t('quiz.newAnswerCorrect'), isCorrect: true}],
        isMultipleChoice: false
      };
      return {...prev, questions: [...prev.questions, newQuestion]};
    });
  };

  const removeQuestion = (qIndex: number) => {
    setQuiz(prev => {
      const newQuestions = prev.questions.filter((_, i) => i !== qIndex);
      return {...prev, questions: newQuestions};
    });
  };
  
  const addAnswer = (qIndex: number) => {
    setQuiz(prev => {
        const newQuestions = [...prev.questions];
        const question = newQuestions[qIndex];
        const answerId = `${question.id}-a${Date.now()}`;
        const newAnswer: Answer = { id: answerId, text: t('quiz.newAnswer'), isCorrect: false };
        question.answers.push(newAnswer);
        return {...prev, questions: newQuestions};
    });
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
     setQuiz(prev => {
        const newQuestions = [...prev.questions];
        const newAnswers = newQuestions[qIndex].answers.filter((_, i) => i !== aIndex);
        newQuestions[qIndex] = {...newQuestions[qIndex], answers: newAnswers};
        return {...prev, questions: newQuestions};
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (quiz) {
        try {
            await updateQuizAction(courseId, chapterId, quiz);
            toast({
                title: t('quiz.savedTitle'),
                description: t('quiz.savedDescription', { title: initialChapterTitle }),
            });
        } catch (error) {
            console.error(error);
            toast({
                title: tc('errorTitle'),
                description: t('quiz.saveErrorDescription'),
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }
  };
  
  if (!quiz) {
    return null; // Should be handled by the parent server component with notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}`} className="hover:text-primary">{t('editLesson.breadcrumbCourse')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}/chapters/${chapterId}`} className="hover:text-primary max-w-xs truncate">{initialChapterTitle}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground truncate max-w-xs">{t('chapterDetail.editQuiz')}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg"><GraduationCap className="h-8 w-8 text-primary" /></div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('quiz.title')}</h1>
                <p className="text-muted-foreground">{t('editLesson.chapterLabel', { title: initialChapterTitle })}</p>
            </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('editLesson.save')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
           <div className="space-y-2">
                <Label htmlFor="quizTitle">{t('quiz.quizTitle')}</Label>
                <Input id="quizTitle" value={quiz.title} onChange={(e) => handleQuizChange('title', e.target.value)} />
            </div>
            <div>
                <Label>{t('quiz.feedbackTimingLabel')}</Label>
                 <RadioGroup value={quiz.feedbackTiming} onValueChange={(value) => handleQuizChange('feedbackTiming', value as 'end' | 'immediate')} className="flex items-center gap-4 mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="end" id="r-end" /><Label htmlFor="r-end">{t('quiz.feedbackEnd')}</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="immediate" id="r-immediate" /><Label htmlFor="r-immediate">{t('quiz.feedbackImmediate')}</Label></div>
                </RadioGroup>
            </div>
        </CardContent>
      </Card>

      <Separator />

        <h2 className="text-xl font-bold">{t('quiz.questionsTitle')}</h2>
        {quiz.questions.map((q, qIndex) => (
            <Card key={q.id}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-lg">{t('quiz.questionLabel', { number: qIndex + 1 })}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`q-text-${q.id}`}>{t('quiz.questionTextLabel')}</Label>
                        <Textarea id={`q-text-${q.id}`} value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} />
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id={`q-multi-${q.id}`} checked={q.isMultipleChoice} onCheckedChange={(checked) => handleQuestionChange(qIndex, 'isMultipleChoice', checked)} />
                        <Label htmlFor={`q-multi-${q.id}`}>{t('quiz.allowMultipleChoice')}</Label>
                    </div>
                    
                    <Separator />
                    <Label>{t('quiz.answersLabel')}</Label>
                    <div className="space-y-2">
                        {q.answers.map((a, aIndex) => (
                             <div key={a.id} className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="cursor-grab"><GripVertical className="h-4 w-4" /></Button>
                                <Input value={a.text} onChange={(e) => handleAnswerChange(qIndex, aIndex, 'text', e.target.value)} placeholder={t('quiz.answerPlaceholder', { number: aIndex + 1 })} />
                                <div className="flex items-center gap-2 p-2 border rounded-md">
                                    <input type="checkbox" id={`a-correct-${a.id}`} checked={a.isCorrect} onChange={(e) => handleAnswerChange(qIndex, aIndex, 'isCorrect', e.target.checked)}/>
                                    <Label htmlFor={`a-correct-${a.id}`}>{t('quiz.correctLabel')}</Label>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeAnswer(qIndex, aIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                             </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addAnswer(qIndex)}><PlusCircle className="mr-2 h-4 w-4"/> {t('quiz.addAnswer')}</Button>
                </CardContent>
            </Card>
        ))}
         <Button onClick={addQuestion}><PlusCircle className="mr-2 h-4 w-4"/> {t('quiz.addQuestion')}</Button>
    </div>
  );
}

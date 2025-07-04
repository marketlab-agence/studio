
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Quiz } from '@/types/tutorial.types';
import { CheckCircle, XCircle, ChevronRight, History, AlertCircle, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { useTutorial } from '@/contexts/TutorialContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TUTORIALS } from '@/lib/tutorials';
import { useAuth } from '@/contexts/AuthContext';

type QuizViewProps = {
    quiz: Quiz;
    onQuizComplete: (score: number, answers: Record<string, string[]>) => void;
    onFinishQuiz: () => void;
};

type UserAnswers = Record<string, string[]>;

export function QuizView({ quiz, onQuizComplete, onFinishQuiz }: QuizViewProps) {
    const router = useRouter();
    const { progress, resetChapter, setCurrentLocation, courseChapters } = useTutorial();
    const { isPremium } = useAuth();
    const existingScore = progress.quizScores[quiz.id];
    const hasPassedBefore = existingScore !== undefined && existingScore >= quiz.passingScore;
    const existingAnswers = progress.quizAnswers?.[quiz.id];

    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [calculatedScore, setCalculatedScore] = useState(0);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    const resetQuiz = useCallback(() => {
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setCalculatedScore(0);
    }, []);
    
    const handleResetChapterAndStartOver = () => {
        resetChapter(quiz.id);
        const chapter = TUTORIALS.find(c => c.id === quiz.id);
        if (chapter && chapter.lessons.length > 0) {
            setCurrentLocation(chapter.id, chapter.lessons[0].id);
        }
    };

    useEffect(() => {
        // This effect decides whether to show a fresh quiz or past results.
        // It should not interfere if the user has just completed the quiz in the current session.
        if (showResults) {
            return;
        }

        // If the user has passed this quiz before, just show them the results.
        if (hasPassedBefore) {
            setUserAnswers(existingAnswers || {});
            setShowResults(true);
        } else {
            // Otherwise, start a fresh quiz.
            resetQuiz();
        }
    }, [quiz.id, hasPassedBefore, existingAnswers, resetQuiz, showResults]);
    
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return <div>Chargement du quiz...</div>;
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    const handleAnswerChange = (answerId: string) => {
        const newAnswersForQuestion = currentQuestion.isMultipleChoice
            ? (userAnswers[currentQuestion.id] || []).includes(answerId)
                ? (userAnswers[currentQuestion.id] || []).filter(a => a !== answerId)
                : [...(userAnswers[currentQuestion.id] || []), answerId]
            : [answerId];
        
        setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: newAnswersForQuestion }));
    };

    const handleNext = () => {
        if (!isLastQuestion) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            const { totalScore, maxScore } = quiz.questions.reduce((acc, q) => {
                const userAnswersForQuestion = new Set(userAnswers[q.id] || []);

                if (q.isMultipleChoice) {
                    const correctAnswersForQuestion = q.answers.filter(a => a.isCorrect);
                    const totalCorrectAnswers = correctAnswersForQuestion.length;

                    if (totalCorrectAnswers === 0) {
                        const questionScore = userAnswersForQuestion.size === 0 ? 1 : 0;
                        return { totalScore: acc.totalScore + questionScore, maxScore: acc.maxScore + 1 };
                    }
                    
                    const correctSelected = q.answers.filter(a => a.isCorrect && userAnswersForQuestion.has(a.id)).length;
                    const incorrectSelected = q.answers.filter(a => !a.isCorrect && userAnswersForQuestion.has(a.id)).length;
                    
                    const questionScore = Math.max(0, (correctSelected - incorrectSelected) / totalCorrectAnswers);
                    
                    return { totalScore: acc.totalScore + questionScore, maxScore: acc.maxScore + 1 };

                } else { // Single choice question
                    const correctAnswerId = q.answers.find(a => a.isCorrect)?.id;
                    const userAnswerId = userAnswers[q.id]?.[0];
                    const isCorrect = correctAnswerId && userAnswerId === correctAnswerId;
                    
                    return {
                        totalScore: acc.totalScore + (isCorrect ? 1 : 0),
                        maxScore: acc.maxScore + 1
                    };
                }
            }, { totalScore: 0, maxScore: 0 });
            
            const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

            setCalculatedScore(finalScore);
            onQuizComplete(finalScore, userAnswers);
            setShowResults(true);
        }
    };
    
    const finalScore = hasPassedBefore ? (existingScore ?? 0) : calculatedScore;
    const isQuizPassed = finalScore >= quiz.passingScore;
    const isFirstChapterQuiz = courseChapters[0]?.id === quiz.id;
    const showUpgradePrompt = isQuizPassed && isFirstChapterQuiz && !isPremium;

     useEffect(() => {
        if (showResults && showUpgradePrompt) {
            setShowUpgradeDialog(true);
        }
    }, [showResults, showUpgradePrompt]);

    if (showResults) {
        return (
            <>
                <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-400" /> 
                                Félicitations !
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Vous avez brillamment réussi le premier chapitre ! Pour débloquer la suite du cours et toutes nos formations, passez à la formule Premium.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                             <AlertDialogCancel>Plus tard</AlertDialogCancel>
                            <AlertDialogAction onClick={() => router.push('/pricing')}>
                                Voir les abonnements
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                    <Card className="w-full max-w-2xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Résultats du Quiz</CardTitle>
                            <CardDescription>Votre score :</CardDescription>
                            <p className={cn("text-5xl font-bold", isQuizPassed ? 'text-green-500' : 'text-destructive')}>
                                {finalScore.toFixed(0)}%
                            </p>
                        </CardHeader>
                        <CardContent>
                            {isQuizPassed ? (
                                <Alert variant="default" className="bg-green-500/10 border-green-500/50 text-green-500">
                                    <CheckCircle className="h-4 w-4 !text-green-500" />
                                    <AlertTitle>Félicitations !</AlertTitle>
                                    <AlertDescription>
                                        Vous avez réussi le quiz.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertTitle>Oups ! Score insuffisant</AlertTitle>
                                    <AlertDescription>
                                        Vous n'avez pas atteint le score de {quiz.passingScore}%. Veuillez réviser le chapitre et réessayer le quiz.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {isPremium && isQuizPassed && (
                                <div className="mt-6 space-y-4 max-h-60 overflow-y-auto p-2">
                                    <h3 className="font-semibold">Correction détaillée :</h3>
                                    {quiz.questions.map(q => {
                                        const userAnswersForQuestion = new Set(userAnswers[q.id] || []);
                                        return (
                                            <div key={q.id} className="text-sm p-2 rounded-md bg-muted/50">
                                                <p className="font-medium">{q.text}</p>
                                                <ul className="list-none pl-0 mt-2 space-y-1">
                                                    {q.answers.map(a => {
                                                        const wasSelected = userAnswersForQuestion.has(a.id);
                                                        const isCorrect = !!a.isCorrect;

                                                        if (q.isMultipleChoice) {
                                                            if (isCorrect && wasSelected) return <li key={a.id} className="flex items-center gap-2 text-green-400"><CheckCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span></li>;
                                                            if (isCorrect && !wasSelected) return <li key={a.id} className="flex items-center gap-2 text-red-400"><AlertCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span> <span className='text-xs font-bold'>(Réponse correcte manquée)</span></li>;
                                                            if (!isCorrect && wasSelected) return <li key={a.id} className="flex items-center gap-2 text-red-400"><XCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span> <span className='text-xs font-bold'>(Votre réponse incorrecte)</span></li>;
                                                            return <li key={a.id} className="flex items-center gap-2 text-muted-foreground"><Circle className="h-4 w-4 shrink-0" /><span>{a.text}</span></li>;
                                                        } else {
                                                            if (isCorrect) return <li key={a.id} className="flex items-center gap-2 text-green-400"><CheckCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span> <span className='text-xs font-bold'>(Bonne réponse)</span></li>;
                                                            if (!isCorrect && wasSelected) return <li key={a.id} className="flex items-center gap-2 text-red-400"><XCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span> <span className='text-xs font-bold'>(Votre réponse)</span></li>;
                                                            return <li key={a.id} className="flex items-center gap-2 text-muted-foreground"><Circle className="h-4 w-4 shrink-0" /><span>{a.text}</span></li>;
                                                        }
                                                    })}
                                                </ul>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex-row-reverse gap-2">
                            {isQuizPassed ? (
                                <Button onClick={onFinishQuiz} disabled={showUpgradePrompt}>
                                    Continuer
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={resetQuiz}>
                                    Réessayer le quiz
                                </Button>
                            )}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline">
                                        <History className="mr-2 h-4 w-4" />
                                        Recommencer le chapitre
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action effacera votre score et votre progression pour ce chapitre. Vous devrez recommencer depuis la première leçon.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleResetChapterAndStartOver}>Confirmer</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                </div>
            </>
        );
    }
    
    const progressValue = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    
    const renderAnswerOptions = () => {
        const isSelected = (answerId: string) => userAnswers[currentQuestion.id]?.includes(answerId) ?? false;
        
        return currentQuestion.answers.map(a => {
            if (currentQuestion.isMultipleChoice) {
                return (
                    <div key={a.id} className="flex items-center space-x-3 p-3 rounded-md border border-transparent has-[:checked]:border-primary transition-colors">
                        <Checkbox
                            id={`${currentQuestion.id}-${a.id}`}
                            onCheckedChange={() => handleAnswerChange(a.id)}
                            checked={isSelected(a.id)}
                        />
                        <Label htmlFor={`${currentQuestion.id}-${a.id}`} className="flex-1 cursor-pointer">{a.text}</Label>
                    </div>
                )
            }
            return (
                 <Label key={a.id} htmlFor={`${currentQuestion.id}-${a.id}`} className="flex items-center space-x-3 p-3 rounded-md border border-transparent has-[[data-state=checked]]:border-primary transition-colors cursor-pointer">
                    <RadioGroupItem 
                        value={a.id} 
                        id={`${currentQuestion.id}-${a.id}`}
                    />
                    <span className="flex-1">{a.text}</span>
                </Label>
            )
        });
    }

    return (
        <div className="flex h-full items-center justify-center p-8 bg-muted/30">
            <Card className="w-full max-w-2xl" key={currentQuestion.id}>
                <CardHeader>
                    <div className='mb-4'>
                        <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} sur {quiz.questions.length}</p>
                        <Progress value={progressValue} className="mt-2 h-2" />
                    </div>
                    <CardTitle>{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 min-h-[250px] p-6">
                    <div>
                        <p className="font-medium text-lg">{currentQuestion.text}</p>
                        <p className="text-sm text-muted-foreground mt-2 mb-4">{currentQuestion.isMultipleChoice ? "Plusieurs réponses sont possibles." : "Une seule réponse est possible."}</p>
                        
                        {currentQuestion.isMultipleChoice ? (
                            <div className="space-y-3">
                                {renderAnswerOptions()}
                            </div>
                        ) : (
                            <RadioGroup 
                                onValueChange={(val) => handleAnswerChange(val)}
                                value={userAnswers[currentQuestion.id]?.[0]}
                                className="space-y-3"
                            >
                                {renderAnswerOptions()}
                            </RadioGroup>
                        )}
                    </div>
                </CardContent>

                <CardFooter>
                    <Button onClick={handleNext} disabled={!userAnswers[currentQuestion.id] || userAnswers[currentQuestion.id].length === 0} className="ml-auto">
                       {isLastQuestion ? 'Terminer et voir les résultats' : 'Question suivante'}
                       {!isLastQuestion && <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

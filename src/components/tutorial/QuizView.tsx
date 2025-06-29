
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Quiz } from '@/types/tutorial.types';
import { CheckCircle, XCircle, ChevronRight, History, AlertCircle, Circle } from 'lucide-react';
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

type QuizViewProps = {
    quiz: Quiz;
    onQuizComplete: (score: number) => void;
    onFinishQuiz: () => void;
};

type UserAnswers = Record<string, string[]>;

export function QuizView({ quiz, onQuizComplete, onFinishQuiz }: QuizViewProps) {
    const { progress, resetChapter, setCurrentLocation } = useTutorial();
    const existingScore = progress.quizScores[quiz.id];
    const hasPassedBefore = existingScore !== undefined && existingScore >= quiz.passingScore;

    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showResults, setShowResults] = useState(hasPassedBefore);
    const [calculatedScore, setCalculatedScore] = useState(0);

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
        if (hasPassedBefore) {
            setShowResults(true);
        } else {
            resetQuiz();
        }
    }, [quiz.id, hasPassedBefore, resetQuiz]);
    
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
                const correctAnswers = new Set(q.answers.filter(a => a.isCorrect).map(a => a.id));
                const userAnswersForQuestion = new Set(userAnswers[q.id] || []);

                if (q.isMultipleChoice) {
                    // Pour les questions à choix multiples, on utilise un système de crédit partiel
                    const totalCorrectAnswers = correctAnswers.size;
                    
                    let score = 0;
                    
                    // Points positifs pour les bonnes réponses sélectionnées
                    const correctSelected = [...userAnswersForQuestion].filter(id => correctAnswers.has(id)).length;
                    score += correctSelected;
                    
                    // Points négatifs pour les mauvaises réponses sélectionnées
                    const incorrectSelected = [...userAnswersForQuestion].filter(id => !correctAnswers.has(id)).length;
                    score -= incorrectSelected;
                    
                    // Le score ne peut pas être négatif
                    score = Math.max(0, score);
                    
                    // Normaliser le score sur la base du nombre de bonnes réponses
                    const questionScore = totalCorrectAnswers > 0 ? score / totalCorrectAnswers : 0;
                    
                    return {
                        totalScore: acc.totalScore + questionScore,
                        maxScore: acc.maxScore + 1
                    };
                } else {
                    // Pour les questions à choix unique, logique existante
                    const isCorrect = correctAnswers.size === userAnswersForQuestion.size && 
                                    [...correctAnswers].every(answerId => userAnswersForQuestion.has(answerId));
                    
                    return {
                        totalScore: acc.totalScore + (isCorrect ? 1 : 0),
                        maxScore: acc.maxScore + 1
                    };
                }
            }, { totalScore: 0, maxScore: 0 });
            
            const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

            setCalculatedScore(finalScore);
            onQuizComplete(finalScore);
            setShowResults(true);
        }
    };
    
    const finalScore = hasPassedBefore ? existingScore : calculatedScore;
    const isQuizPassed = finalScore >= quiz.passingScore;

    if (showResults) {
        return (
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
                                    Vous avez réussi le quiz. Vous pouvez passer au chapitre suivant.
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

                        {isQuizPassed && (
                            <div className="mt-6 space-y-4 max-h-60 overflow-y-auto p-2">
                                <h3 className="font-semibold">Correction détaillée :</h3>
                                {quiz.questions.map(q => (
                                    <div key={q.id} className="text-sm p-2 rounded-md bg-muted/50">
                                        <p className="font-medium">{q.text}</p>
                                        <ul className="list-none pl-0 mt-2 space-y-1">
                                            {q.answers.map(a => {
                                                const wasSelected = !hasPassedBefore && (userAnswers[q.id] || []).includes(a.id);
                                                const isCorrect = !!a.isCorrect;

                                                if (q.isMultipleChoice) {
                                                    // Logic for multiple choice
                                                    if (isCorrect && wasSelected) {
                                                        return <li key={a.id} className="flex items-center gap-2 text-green-400"><CheckCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span></li>;
                                                    }
                                                    if (isCorrect && !wasSelected) {
                                                        return <li key={a.id} className="flex items-center gap-2 text-red-400"><AlertCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span><span className="text-xs font-bold">(Réponse correcte manquée)</span></li>;
                                                    }
                                                    if (!isCorrect && wasSelected) {
                                                        return <li key={a.id} className="flex items-center gap-2 text-red-400"><XCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span><span className="text-xs font-bold">(Votre réponse incorrecte)</span></li>;
                                                    }
                                                    // Fallthrough for !isCorrect && !wasSelected
                                                    return <li key={a.id} className="flex items-center gap-2 text-muted-foreground"><Circle className="h-4 w-4 shrink-0" /><span>{a.text}</span></li>;
                                                } else {
                                                    // Logic for single choice
                                                    const userSingleAnswer = (userAnswers[q.id] || [])[0];
                                                    const wasThisOptionSelected = userSingleAnswer === a.id;
                                                    
                                                    if (isCorrect) {
                                                        // Always show the correct answer in green
                                                        return <li key={a.id} className="flex items-center gap-2 text-green-400"><CheckCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span></li>;
                                                    }
                                                    if (wasThisOptionSelected) {
                                                        // If this was the user's (wrong) choice, show it in red
                                                        return <li key={a.id} className="flex items-center gap-2 text-red-400"><XCircle className="h-4 w-4 shrink-0" /><span>{a.text}</span><span className="text-xs font-bold">(Votre réponse)</span></li>;
                                                    }
                                                    // Otherwise, show as neutral
                                                    return <li key={a.id} className="flex items-center gap-2 text-muted-foreground"><Circle className="h-4 w-4 shrink-0" /><span>{a.text}</span></li>;
                                                }
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex-row-reverse gap-2">
                        {isQuizPassed ? (
                            <Button onClick={onFinishQuiz}>
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

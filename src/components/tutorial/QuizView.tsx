'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Quiz } from '@/types/tutorial.types';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

type QuizViewProps = {
    quiz: Quiz;
    onQuizComplete: (score: number) => void;
    onFinishQuiz: () => void;
};

type UserAnswers = Record<string, string[]>;

export function QuizView({ quiz, onQuizComplete, onFinishQuiz }: QuizViewProps) {
    // State for the whole quiz
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showResults, setShowResults] = useState(false);

    // State for the current question
    const [currentSelection, setCurrentSelection] = useState<string[]>([]);
    const [questionStatus, setQuestionStatus] = useState<'unanswered' | 'answered'>('unanswered');


    const resetQuiz = useCallback(() => {
        setUserAnswers({});
        setCorrectAnswersCount(0);
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setCurrentSelection([]);
        setQuestionStatus('unanswered');
    }, []);

    useEffect(() => {
        resetQuiz();
    }, [quiz.id, resetQuiz]);
    
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return <div>Chargement du quiz...</div>;
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    const handleAnswerChange = (answerId: string) => {
        if (questionStatus === 'answered') return;

        if (currentQuestion.isMultipleChoice) {
            setCurrentSelection(prev => 
                prev.includes(answerId) 
                    ? prev.filter(a => a !== answerId) 
                    : [...prev, answerId]
            );
        } else {
            setCurrentSelection([answerId]);
        }
    };

    const handleCheckAnswer = () => {
        if (currentSelection.length === 0) return;

        const correctIds = currentQuestion.answers.filter(a => a.isCorrect).map(a => a.id).sort();
        const userSelectionSorted = [...currentSelection].sort();

        const isAnswerCorrect = correctIds.length === userSelectionSorted.length && correctIds.every((id, i) => id === userSelectionSorted[i]);

        if (isAnswerCorrect) {
            setCorrectAnswersCount(prev => prev + 1);
        }

        setQuestionStatus('answered');
        setUserAnswers(prev => ({...prev, [currentQuestion.id]: currentSelection}));
    };

    const handleNextQuestion = () => {
        if (isLastQuestion) {
            const finalScore = (correctAnswersCount / quiz.questions.length) * 100;
            onQuizComplete(finalScore);
            setShowResults(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setCurrentSelection([]);
            setQuestionStatus('unanswered');
        }
    };

    const finalScore = (correctAnswersCount / quiz.questions.length) * 100;
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
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            {q.answers.map(a => {
                                                const isUserAnswer = userAnswers[q.id]?.includes(a.id);
                                                return (
                                                    <li key={a.id} className={cn(
                                                        'flex items-center gap-2',
                                                        a.isCorrect ? 'text-green-400' : (isUserAnswer ? 'text-red-400' : 'text-muted-foreground')
                                                    )}>
                                                        {a.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                        <span>{a.text}</span>
                                                        {isUserAnswer && !a.isCorrect && <span className="text-xs font-bold">(Votre réponse)</span>}
                                                    </li>
                                                )
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
                                Chapitre suivant
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <>
                                <Button onClick={resetQuiz}>
                                    Recommencer le quiz
                                </Button>
                                <Button variant="outline" onClick={onFinishQuiz}>
                                    Réviser le chapitre
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    const progressValue = ((currentQuestionIndex) / quiz.questions.length) * 100;

    const renderAnswerOptions = () => {
        const isAnswered = questionStatus === 'answered';
        
        const getAnswerClass = (answerId: string, isCorrect: boolean) => {
            if (!isAnswered) return 'border-transparent has-[:checked]:border-primary';
            const isSelected = currentSelection.includes(answerId);
            if (isCorrect) return 'border-green-500 bg-green-500/10';
            if (isSelected && !isCorrect) return 'border-destructive bg-destructive/10';
            return 'border-transparent';
        };

        return currentQuestion.answers.map(a => {
            if (currentQuestion.isMultipleChoice) {
                return (
                    <div key={a.id} className={cn(
                        "flex items-center space-x-3 p-3 rounded-md border transition-colors",
                        getAnswerClass(a.id, !!a.isCorrect)
                    )}>
                        <Checkbox
                            id={`${currentQuestion.id}-${a.id}`}
                            onCheckedChange={() => handleAnswerChange(a.id)}
                            checked={currentSelection.includes(a.id)}
                            disabled={isAnswered}
                        />
                        <Label htmlFor={`${currentQuestion.id}-${a.id}`} className="flex-1 cursor-pointer">{a.text}</Label>
                        {isAnswered && a.isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {isAnswered && !a.isCorrect && currentSelection.includes(a.id) && <XCircle className="h-5 w-5 text-destructive" />}
                    </div>
                )
            }
            return (
                 <Label key={a.id} htmlFor={`${currentQuestion.id}-${a.id}`} className={cn(
                    "flex items-center space-x-3 p-3 rounded-md border transition-colors cursor-pointer",
                    getAnswerClass(a.id, !!a.isCorrect)
                 )}>
                    <RadioGroupItem 
                        value={a.id} 
                        id={`${currentQuestion.id}-${a.id}`}
                        disabled={isAnswered}
                    />
                    <span className="flex-1">{a.text}</span>
                    {isAnswered && a.isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {isAnswered && !a.isCorrect && currentSelection.includes(a.id) && <XCircle className="h-5 w-5 text-destructive" />}
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
                                value={currentSelection[0]}
                                className="space-y-3"
                                disabled={questionStatus === 'answered'}
                            >
                                {renderAnswerOptions()}
                            </RadioGroup>
                        )}
                    </div>
                </CardContent>

                <CardFooter>
                    {questionStatus === 'unanswered' ? (
                        <Button onClick={handleCheckAnswer} disabled={currentSelection.length === 0} className="ml-auto">
                            Vérifier
                        </Button>
                    ) : (
                        <Button onClick={handleNextQuestion} className="ml-auto">
                           {isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
                           {!isLastQuestion && <ChevronRight className="ml-2 h-4 w-4" />}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

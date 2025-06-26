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
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const resetQuiz = useCallback(() => {
        setUserAnswers({});
        setIsSubmitted(false);
        setFinalScore(0);
        setCurrentQuestionIndex(0);
    }, []);

    useEffect(() => {
        resetQuiz();
    }, [quiz.id, resetQuiz]);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    const handleAnswerChange = (questionId: string, answerId: string, isMultipleChoice?: boolean) => {
        setUserAnswers(prev => {
            const newAnswers = { ...prev };
            if (isMultipleChoice) {
                const currentAnswers = newAnswers[questionId] || [];
                if (currentAnswers.includes(answerId)) {
                    newAnswers[questionId] = currentAnswers.filter(a => a !== answerId);
                } else {
                    newAnswers[questionId] = [...currentAnswers, answerId];
                }
            } else {
                newAnswers[questionId] = [answerId];
            }
            return newAnswers;
        });
    };

    const handleSubmitQuiz = () => {
        let correctCount = 0;
        quiz.questions.forEach(q => {
             const correctIds = q.answers.filter(a => a.isCorrect).map(a => a.id).sort();
             const userAns = (userAnswers[q.id] || []).sort();
             if (correctIds.length === userAns.length && correctIds.every((id, i) => id === userAns[i])) {
                 correctCount++;
             }
        });
        const calculatedScore = (correctCount / quiz.questions.length) * 100;
        setFinalScore(calculatedScore);
        setIsSubmitted(true);
        onQuizComplete(calculatedScore);
    };

    const handleNextQuestion = () => {
        if (isLastQuestion) {
            handleSubmitQuiz();
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const isQuizPassed = finalScore >= quiz.passingScore;

    if (isSubmitted) {
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
    
    const isCurrentQuestionAnswered = userAnswers[currentQuestion.id] && userAnswers[currentQuestion.id].length > 0;
    const progressValue = ((currentQuestionIndex) / quiz.questions.length) * 100;

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
                                {currentQuestion.answers.map(a => (
                                    <div key={a.id} className="flex items-center space-x-3 p-3 rounded-md border border-transparent has-[:checked]:border-primary transition-colors">
                                        <Checkbox
                                            id={`${currentQuestion.id}-${a.id}`}
                                            onCheckedChange={() => handleAnswerChange(currentQuestion.id, a.id, true)}
                                            checked={userAnswers[currentQuestion.id]?.includes(a.id)}
                                        />
                                        <Label htmlFor={`${currentQuestion.id}-${a.id}`} className="flex-1 cursor-pointer">{a.text}</Label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <RadioGroup 
                                onValueChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                                value={userAnswers[currentQuestion.id]?.[0]}
                                className="space-y-3"
                            >
                                {currentQuestion.answers.map(a => (
                                    <div key={a.id} className="flex items-center space-x-3 p-3 rounded-md border border-transparent has-[:checked]:border-primary transition-colors">
                                        <RadioGroupItem value={a.id} id={`${currentQuestion.id}-${a.id}`} />
                                        <Label htmlFor={`${currentQuestion.id}-${a.id}`} className="flex-1 cursor-pointer">{a.text}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                    </div>
                </CardContent>

                <CardFooter>
                     <Button onClick={handleNextQuestion} disabled={!isCurrentQuestionAnswered} className="ml-auto">
                        {isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
                        {!isLastQuestion && <ChevronRight className="ml-2 h-4 w-4" />}
                     </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

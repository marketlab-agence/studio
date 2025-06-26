'use client';

import React, { useState } from 'react';
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
};

type UserAnswers = Record<string, string[]>;

export function QuizView({ quiz, onQuizComplete }: QuizViewProps) {
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

    const handleSubmit = () => {
        let correctAnswers = 0;
        quiz.questions.forEach(q => {
            const correct = q.answers.filter(a => a.isCorrect).map(a => a.id);
            const user = userAnswers[q.id] || [];

            if (correct.length === user.length && correct.every(id => user.includes(id))) {
                correctAnswers++;
            }
        });

        const newScore = (correctAnswers / quiz.questions.length) * 100;
        setScore(newScore);
        setIsSubmitted(true);
        onQuizComplete(newScore);
    };

    const handleNext = () => {
        if (isLastQuestion) {
            handleSubmit();
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const isQuizPassed = score >= quiz.passingScore;

    if (isSubmitted) {
        return (
            <div className="flex h-full items-center justify-center p-8 bg-muted/30">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Résultats du Quiz</CardTitle>
                        <CardDescription>Votre score :</CardDescription>
                         <p className={cn("text-5xl font-bold", isQuizPassed ? 'text-green-500' : 'text-destructive')}>
                            {score.toFixed(0)}%
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
                                <AlertTitle>Oups !</AlertTitle>
                                <AlertDescription>
                                    Vous n'avez pas atteint le score de {quiz.passingScore}%. Veuillez réviser le chapitre et réessayer le quiz.
                                </AlertDescription>
                            </Alert>
                        )}

                        {isQuizPassed && (
                            <div className="mt-6 space-y-4 max-h-60 overflow-y-auto p-2">
                                <h3 className="font-semibold">Correction :</h3>
                                {quiz.questions.map(q => (
                                    <div key={q.id} className="text-sm">
                                        <p className="font-medium">{q.text}</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            {q.answers.map(a => (
                                                <li key={a.id} className={cn(
                                                    'flex items-center gap-2',
                                                    a.isCorrect ? 'text-green-400' : (userAnswers[q.id]?.includes(a.id) ? 'text-red-400' : 'text-muted-foreground')
                                                )}>
                                                    {a.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                    <span>{a.text}</span>
                                                    {userAnswers[q.id]?.includes(a.id) && !a.isCorrect && <span className="text-xs font-bold">(Votre réponse)</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        {/* The parent component will show navigation controls */}
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const isCurrentQuestionAnswered = userAnswers[currentQuestion.id] && userAnswers[currentQuestion.id].length > 0;
    const progressValue = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="flex h-full items-center justify-center p-8 bg-muted/30">
            <Card className="w-full max-w-2xl">
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
                        <p className="text-sm text-muted-foreground mt-2 mb-4">{currentQuestion.isMultipleChoice ? "Plusieurs réponses possibles." : "Une seule réponse possible."}</p>
                        
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
                    <Button onClick={handleNext} disabled={!isCurrentQuestionAnswered} className="ml-auto">
                        {isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
                        {!isLastQuestion && <ChevronRight className="ml-2 h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

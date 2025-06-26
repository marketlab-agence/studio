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
import { useTutorial } from '@/contexts/TutorialContext';

type QuizViewProps = {
    quiz: Quiz;
    onQuizComplete: (score: number) => void;
    onFinishQuiz: () => void;
};

type UserAnswers = Record<string, string[]>;

export function QuizView({ quiz, onQuizComplete, onFinishQuiz }: QuizViewProps) {
    const { progress } = useTutorial();
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
            let correctCount = 0;
            quiz.questions.forEach(q => {
                const correctAnswers = q.answers.filter(a => a.isCorrect).map(a => a.id).sort();
                const userSelection = (userAnswers[q.id] || []).sort();
                if (JSON.stringify(correctAnswers) === JSON.stringify(userSelection)) {
                    correctCount++;
                }
            });
            const finalScore = (correctCount / quiz.questions.length) * 100;
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
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            {q.answers.map(a => {
                                                const isUserAnswer = !hasPassedBefore && userAnswers[q.id]?.includes(a.id);
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
                                Continuer
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

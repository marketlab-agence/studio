import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

type NavigationControlsProps = {
  onTakeQuiz?: () => void;
};

export function NavigationControls({ onTakeQuiz }: NavigationControlsProps) {
    const { 
        goToNextLesson, 
        goToPreviousLesson,
        isFirstLessonInTutorial,
        isLastLessonInTutorial
    } = useTutorial();

    return (
        <div className="flex justify-between items-center p-4 border-t bg-card">
            <Button variant="outline" onClick={goToPreviousLesson} disabled={isFirstLessonInTutorial}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
            </Button>
            
            {onTakeQuiz ? (
                 <Button onClick={onTakeQuiz}>
                    Passer le quiz
                    <GraduationCap className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={goToNextLesson} disabled={isLastLessonInTutorial}>
                    Leçon suivante
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

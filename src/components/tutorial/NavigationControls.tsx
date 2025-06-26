import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { TUTORIALS } from '@/lib/tutorials';

type NavigationControlsProps = {
  onTakeQuiz?: () => void;
};

export function NavigationControls({ onTakeQuiz }: NavigationControlsProps) {
    const { currentChapter, currentLesson, setCurrentLocation, completeLesson } = useTutorial();

    if (!currentChapter || !currentLesson) return null;

    const lessonIndex = currentChapter.lessons.findIndex(l => l.id === currentLesson.id);
    const chapterIndex = TUTORIALS.findIndex(c => c.id === currentChapter.id);

    const isFirstLesson = lessonIndex === 0;
    const isLastLesson = lessonIndex === currentChapter.lessons.length - 1;

    const goTo = (chapIdx: number, lessIdx: number) => {
        const chapter = TUTORIALS[chapIdx];
        const lesson = chapter?.lessons[lessIdx];
        if(chapter && lesson) {
            setCurrentLocation(chapter.id, lesson.id);
        }
    }

    const handlePrevious = () => {
        if (!isFirstLesson) {
            goTo(chapterIndex, lessonIndex - 1);
        } else {
            // Go to previous chapter's last lesson
            if (chapterIndex > 0) {
                const prevChapter = TUTORIALS[chapterIndex - 1];
                goTo(chapterIndex - 1, prevChapter.lessons.length - 1);
            }
        }
    };

    const handleNext = () => {
        completeLesson(currentLesson.id);
        if (!isLastLesson) {
            goTo(chapterIndex, lessonIndex + 1);
        } else {
            // Go to next chapter's first lesson
            if(chapterIndex < TUTORIALS.length - 1) {
                goTo(chapterIndex + 1, 0);
            }
        }
    };

    return (
        <div className="flex justify-between items-center p-4 border-t bg-card">
            <Button variant="outline" onClick={handlePrevious} disabled={chapterIndex === 0 && isFirstLesson}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
            </Button>
            
            {onTakeQuiz ? (
                 <Button onClick={onTakeQuiz}>
                    Passer le quiz
                    <GraduationCap className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={handleNext} disabled={isLastLesson && chapterIndex === TUTORIALS.length - 1}>
                    {isLastLesson ? 'Prochain chapitre' : 'Leçon suivante'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

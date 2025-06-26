'use client';
import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { UserProgress } from '@/types/tutorial.types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TUTORIALS } from '@/lib/tutorials';

const initialProgress: UserProgress = {
    quizScores: {},
    completedLessons: new Set(),
    currentChapterId: TUTORIALS[0]?.id || null,
    currentLessonId: TUTORIALS[0]?.lessons[0]?.id || null,
};

type TutorialContextType = {
  progress: UserProgress;
  setCurrentLocation: (chapterId: string, lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  setQuizScore: (quizId: string, score: number) => void;
  currentChapter: typeof TUTORIALS[0] | undefined;
  currentLesson: typeof TUTORIALS[0]['lessons'][0] | undefined;
  totalLessons: number;
  totalCompleted: number;
  overallProgress: number;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Helper to handle Set serialization for localStorage
const replacer = (key: string, value: any) => {
    if (value instanceof Set) {
        return { __dataType: 'Set', value: [...value] };
    }
    return value;
};

const reviver = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.__dataType === 'Set') {
            return new Set(value.value);
        }
    }
    return value;
};

export function TutorialProvider({ children }: { children: ReactNode }) {
    const [progress, setProgress] = useLocalStorage<UserProgress>('git-tutorial-progress', initialProgress, {
        serializer: (value) => JSON.stringify(value, replacer),
        deserializer: (value) => {
            const parsed = JSON.parse(value, reviver);
            // Ensure completedLessons is always a Set
            if (parsed.completedLessons && !(parsed.completedLessons instanceof Set)) {
                parsed.completedLessons = new Set(parsed.completedLessons);
            }
            return { ...initialProgress, ...parsed };
        },
    });

    const setCurrentLocation = useCallback((chapterId: string, lessonId: string) => {
        setProgress(prev => ({ ...prev, currentChapterId: chapterId, currentLessonId: lessonId }));
    }, [setProgress]);

    const completeLesson = useCallback((lessonId: string) => {
        setProgress(prev => {
            const newCompleted = new Set(prev.completedLessons);
            newCompleted.add(lessonId);
            return { ...prev, completedLessons: newCompleted };
        });
    }, [setProgress]);

    const setQuizScore = useCallback((quizId: string, score: number) => {
        setProgress(prev => ({
            ...prev,
            quizScores: { ...prev.quizScores, [quizId]: score }
        }));
    }, [setProgress]);

    const value = useMemo(() => {
        const currentChapter = TUTORIALS.find(t => t.id === progress.currentChapterId);
        const currentLesson = currentChapter?.lessons.find(l => l.id === progress.currentLessonId);

        const totalLessons = TUTORIALS.reduce((acc, curr) => acc + curr.lessons.length, 0);
        const totalCompleted = progress.completedLessons?.size || 0;
        const overallProgress = totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0;

        return { 
            progress, 
            setCurrentLocation,
            completeLesson,
            setQuizScore,
            currentChapter,
            currentLesson,
            totalLessons,
            totalCompleted,
            overallProgress,
        };
    }, [progress, setCurrentLocation, completeLesson, setQuizScore]);


    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
}

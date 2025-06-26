'use client';
import React, { createContext, useContext, ReactNode, useMemo, useCallback, useState } from 'react';
import type { UserProgress } from '@/types/tutorial.types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TUTORIALS } from '@/lib/tutorials';
import { QUIZZES } from '@/lib/quiz';

const initialProgress: UserProgress = {
    quizScores: {},
    completedLessons: new Set(),
    currentChapterId: TUTORIALS[0]?.id || null,
    currentLessonId: TUTORIALS[0]?.lessons[0]?.id || null,
    currentView: 'lesson',
};

type TutorialContextType = {
  progress: UserProgress;
  setCurrentLocation: (chapterId: string, lessonId: string) => void;
  showQuizForChapter: (chapterId: string) => void;
  completeLesson: (lessonId: string) => void;
  setQuizScore: (quizId: string, score: number) => void;
  goToNextLesson: () => void;
  goToPreviousLesson: () => void;
  resetProgress: () => void;
  currentChapter: typeof TUTORIALS[0] | undefined;
  currentLesson: typeof TUTORIALS[0]['lessons'][0] | undefined;
  currentView: 'lesson' | 'quiz';
  totalLessons: number;
  totalCompleted: number;
  overallProgress: number;
  isFirstLessonInTutorial: boolean;
  isLastLessonInTutorial: boolean;
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
            if (parsed.completedLessons && !(parsed.completedLessons instanceof Set)) {
                parsed.completedLessons = new Set(parsed.completedLessons);
            }
            return { ...initialProgress, ...parsed };
        },
    });

    const setCurrentLocation = useCallback((chapterId: string, lessonId: string) => {
        setProgress(prev => ({ ...prev, currentChapterId: chapterId, currentLessonId: lessonId, currentView: 'lesson' }));
    }, [setProgress]);

    const showQuizForChapter = useCallback((chapterId: string) => {
        const chapter = TUTORIALS.find(c => c.id === chapterId);
        if (!chapter) return;
        setProgress(prev => {
            const newCompleted = new Set(prev.completedLessons);
            if (prev.currentLessonId) {
                newCompleted.add(prev.currentLessonId);
            }
            return { 
                ...prev, 
                currentChapterId: chapterId, 
                currentLessonId: prev.currentLessonId,
                currentView: 'quiz',
                completedLessons: newCompleted,
            };
        });
    }, [setProgress]);

    const completeLesson = useCallback((lessonId: string) => {
        setProgress(prev => {
            const newCompleted = new Set(prev.completedLessons);
            newCompleted.add(lessonId);
            return { ...prev, completedLessons: newCompleted };
        });
    }, [setProgress]);

    const setQuizScore = useCallback((quizId: string, score: number) => {
        setProgress(prev => {
            const quiz = QUIZZES[quizId];
            if (!quiz) return { ...prev, quizScores: { ...prev.quizScores, [quizId]: score } };

            const passed = score >= quiz.passingScore;
            let newCompleted = new Set(prev.completedLessons);

            if (passed) {
                const chapter = TUTORIALS.find(c => c.id === quizId);
                if (chapter) {
                    chapter.lessons.forEach(lesson => newCompleted.add(lesson.id));
                }
            }
            
            return {
                ...prev,
                quizScores: { ...prev.quizScores, [quizId]: score },
                completedLessons: newCompleted,
            };
        });
    }, [setProgress]);

    const goToNextLesson = useCallback(() => {
        setProgress(prev => {
            if (!prev.currentChapterId || !prev.currentLessonId) return prev;
    
            const newCompleted = new Set(prev.completedLessons);
            newCompleted.add(prev.currentLessonId);
    
            const chapterIndex = TUTORIALS.findIndex(c => c.id === prev.currentChapterId);
            if (chapterIndex === -1) return prev;
            
            const currentChapter = TUTORIALS[chapterIndex];
            const lessonIndex = currentChapter.lessons.findIndex(l => l.id === prev.currentLessonId);
            if (lessonIndex === -1) return prev;
    
            const isLastLesson = lessonIndex === currentChapter.lessons.length - 1;
    
            let nextChapterId = prev.currentChapterId;
            let nextLessonId = prev.currentLessonId;
    
            if (!isLastLesson) {
                nextLessonId = currentChapter.lessons[lessonIndex + 1].id;
            } else {
                const quiz = QUIZZES[currentChapter.id];
                const score = prev.quizScores[currentChapter.id] ?? 0;
                const passed = score >= (quiz?.passingScore ?? 80);
                if (chapterIndex < TUTORIALS.length - 1 && passed) {
                    const nextChapter = TUTORIALS[chapterIndex + 1];
                    nextChapterId = nextChapter.id;
                    nextLessonId = nextChapter.lessons[0].id;
                }
            }
            
            return {
                ...prev,
                completedLessons: newCompleted,
                currentChapterId: nextChapterId,
                currentLessonId: nextLessonId,
                currentView: 'lesson',
            };
        });
    }, [setProgress]);

    const goToPreviousLesson = useCallback(() => {
        setProgress(prev => {
            if (!prev.currentChapterId || !prev.currentLessonId) return prev;

            const chapterIndex = TUTORIALS.findIndex(c => c.id === prev.currentChapterId);
            if (chapterIndex === -1) return prev;
            
            const currentChapter = TUTORIALS[chapterIndex];
            const lessonIndex = currentChapter.lessons.findIndex(l => l.id === prev.currentLessonId);
            if (lessonIndex === -1) return prev;

            let prevChapterId = prev.currentChapterId;
            let prevLessonId = prev.currentLessonId;

            if (lessonIndex > 0) {
                prevLessonId = currentChapter.lessons[lessonIndex - 1].id;
            } else {
                if (chapterIndex > 0) {
                    const prevChapter = TUTORIALS[chapterIndex - 1];
                    prevChapterId = prevChapter.id;
                    prevLessonId = prevChapter.lessons[prevChapter.lessons.length - 1].id;
                }
            }
            
            return {
                ...prev,
                currentChapterId: prevChapterId,
                currentLessonId: prevLessonId,
                currentView: 'lesson',
            };
        });
    }, [setProgress]);

    const resetProgress = useCallback(() => {
        setProgress(initialProgress);
    }, [setProgress]);

    const value = useMemo(() => {
        const p = (typeof progress === 'object' && progress !== null) ? progress : initialProgress;

        const currentChapter = TUTORIALS.find(t => t.id === p.currentChapterId);
        const currentLesson = currentChapter?.lessons.find(l => l.id === p.currentLessonId);
        const currentView = p.currentView || 'lesson';

        const chapterIndex = TUTORIALS.findIndex(c => c.id === p.currentChapterId);
        const lessonIndex = currentChapter?.lessons.findIndex(l => l.id === p.currentLessonId);

        const totalLessons = TUTORIALS.reduce((acc, curr) => acc + curr.lessons.length, 0);
        
        const totalCompleted = p.completedLessons?.size || 0;
        
        const overallProgress = totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0;
        
        const isFirstLessonInTutorial = chapterIndex === 0 && lessonIndex === 0;
        const isLastLessonInTutorial = chapterIndex === TUTORIALS.length - 1 && lessonIndex === (currentChapter?.lessons.length ?? 0) - 1;

        return { 
            progress: p, 
            setCurrentLocation,
            showQuizForChapter,
            completeLesson,
            setQuizScore,
            goToNextLesson,
            goToPreviousLesson,
            resetProgress,
            currentChapter,
            currentLesson,
            currentView,
            totalLessons,
            totalCompleted,
            overallProgress,
            isFirstLessonInTutorial,
            isLastLessonInTutorial,
        };
    }, [progress, setCurrentLocation, showQuizForChapter, completeLesson, setQuizScore, goToNextLesson, goToPreviousLesson, resetProgress]);


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

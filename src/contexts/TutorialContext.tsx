
'use client';
import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { UserProgress } from '@/types/tutorial.types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TUTORIALS } from '@/lib/tutorials';
import { QUIZZES } from '@/lib/quiz';

const ALL_VALID_LESSON_IDS = new Set<string>();
TUTORIALS.forEach(chapter => chapter.lessons.forEach(lesson => ALL_VALID_LESSON_IDS.add(lesson.id)));

const initialProgress: UserProgress = {
    quizScores: {},
    quizAttempts: {},
    completedLessons: new Set(),
    currentChapterId: null,
    currentLessonId: null,
    currentView: 'lesson',
};

type TutorialContextType = {
  progress: UserProgress;
  setCurrentLocation: (chapterId: string, lessonId: string) => void;
  showQuizForChapter: (chapterId: string) => void;
  setQuizScore: (quizId: string, score: number) => void;
  goToNextLesson: () => void;
  goToPreviousLesson: () => void;
  resetProgress: () => void;
  resetChapter: (chapterId: string) => void;
  currentChapter: typeof TUTORIALS[0] | undefined;
  currentLesson: typeof TUTORIALS[0]['lessons'][0] | undefined;
  currentView: 'lesson' | 'quiz';
  totalLessons: number;
  totalCompleted: number;
  overallProgress: number;
  averageQuizScore: number;
  masteryIndex: number;
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
            let parsed = JSON.parse(value, reviver);
            
            // Sanitize completedLessons
            if (parsed.completedLessons) {
                const validCompletedLessons = new Set<string>();
                for (const lessonId of parsed.completedLessons) {
                    if (ALL_VALID_LESSON_IDS.has(String(lessonId))) {
                        validCompletedLessons.add(String(lessonId));
                    }
                }
                parsed.completedLessons = validCompletedLessons;
            }

            if (parsed.completedLessons && !(parsed.completedLessons instanceof Set)) {
                parsed.completedLessons = new Set(parsed.completedLessons);
            }
            
            // Sanitize current location
            if (parsed.currentLessonId && !ALL_VALID_LESSON_IDS.has(parsed.currentLessonId)) {
                parsed.currentChapterId = initialProgress.currentChapterId;
                parsed.currentLessonId = initialProgress.currentLessonId;
                parsed.currentView = initialProgress.currentView;
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

    const setQuizScore = useCallback((quizId: string, score: number) => {
        setProgress(prev => {
            const quiz = QUIZZES[quizId];
            if (!quiz) return { ...prev, quizScores: { ...prev.quizScores, [quizId]: score } };

            const passed = score >= quiz.passingScore;
            const newCompleted = new Set(prev.completedLessons);
            
            const newAttempts = { ...prev.quizAttempts, [quizId]: (prev.quizAttempts?.[quizId] || 0) + 1 };

            // If the user passes the quiz, mark all lessons in that chapter as complete.
            if (passed) {
                const chapter = TUTORIALS.find(c => c.id === quizId);
                if (chapter) {
                    chapter.lessons.forEach(lesson => newCompleted.add(lesson.id));
                }
            }
            
            return {
                ...prev,
                quizScores: { ...prev.quizScores, [quizId]: score },
                quizAttempts: newAttempts,
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

    const resetChapter = useCallback((chapterId: string) => {
        setProgress(prev => {
            const chapterToReset = TUTORIALS.find(c => c.id === chapterId);
            if (!chapterToReset) return prev;

            const newCompleted = new Set(prev.completedLessons);
            chapterToReset.lessons.forEach(lesson => {
                newCompleted.delete(lesson.id);
            });
            
            const newQuizScores = { ...prev.quizScores };
            delete newQuizScores[chapterId];

            const newQuizAttempts = { ...prev.quizAttempts };
            delete newQuizAttempts[chapterId];

            return {
                ...prev,
                quizScores: newQuizScores,
                quizAttempts: newQuizAttempts,
                completedLessons: newCompleted,
            };
        });
    }, [setProgress]);

    const value = useMemo(() => {
        const p = (typeof progress === 'object' && progress !== null) ? progress : initialProgress;

        const currentChapter = TUTORIALS.find(t => t.id === p.currentChapterId);
        const currentLesson = currentChapter?.lessons.find(l => l.id === p.currentLessonId);
        const currentView = p.currentView || 'lesson';

        const chapterIndex = TUTORIALS.findIndex(c => c.id === p.currentChapterId);
        const lessonIndex = currentChapter?.lessons.findIndex(l => l.id === p.currentLessonId);

        const totalLessons = TUTORIALS.reduce((acc, curr) => acc + curr.lessons.length, 0);
        
        const totalCompleted = (p.completedLessons || new Set()).size;
        const overallProgress = totalLessons > 0 ? Math.min(100, (totalCompleted / totalLessons) * 100) : 0;
        
        const isFirstLessonInTutorial = chapterIndex === 0 && lessonIndex === 0;
        const isLastLessonInTutorial = chapterIndex === TUTORIALS.length - 1 && lessonIndex === (currentChapter?.lessons.length ?? 0) - 1;

        const { quizScores = {}, quizAttempts = {} } = p;
        const passedQuizIds = Object.keys(quizScores).filter(quizId => {
            const quiz = QUIZZES[quizId];
            if (!quiz) return false;
            return quizScores[quizId] >= quiz.passingScore;
        });

        const passedScores = passedQuizIds.map(id => quizScores[id]);
        const averageQuizScore = passedScores.length > 0
            ? passedScores.reduce((a, b) => a + b, 0) / passedScores.length
            : 0;

        const attemptsForPassedQuizzes = passedQuizIds.map(id => quizAttempts[id] || 1);
        const masteryIndex = attemptsForPassedQuizzes.length > 0
            ? attemptsForPassedQuizzes.reduce((a, b) => a + b, 0) / attemptsForPassedQuizzes.length
            : 0;

        return { 
            progress: p, 
            setCurrentLocation,
            showQuizForChapter,
            setQuizScore,
            goToNextLesson,
            goToPreviousLesson,
            resetProgress,
            resetChapter,
            currentChapter,
            currentLesson,
            currentView,
            totalLessons,
            totalCompleted,
            overallProgress,
            averageQuizScore,
            masteryIndex,
            isFirstLessonInTutorial,
            isLastLessonInTutorial,
        };
    }, [progress, setCurrentLocation, showQuizForChapter, setQuizScore, goToNextLesson, goToPreviousLesson, resetProgress, resetChapter]);


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

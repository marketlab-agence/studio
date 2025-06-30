
'use client';
import React, { createContext, useContext, ReactNode, useMemo, useCallback, useState } from 'react';
import type { CourseProgress, GlobalProgress } from '@/types/tutorial.types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TUTORIALS } from '@/lib/tutorials';
import { QUIZZES } from '@/lib/quiz';
import type { CourseInfo } from '@/types/course.types';
import { COURSES } from '@/lib/courses';

const initialCourseProgress: CourseProgress = {
    quizScores: {},
    quizAttempts: {},
    completedLessons: new Set(),
    currentChapterId: null,
    currentLessonId: null,
    currentView: 'lesson',
    quizAnswers: {},
};

type TutorialContextType = {
  progress: CourseProgress;
  globalProgress: GlobalProgress;
  course: CourseInfo | undefined;
  courseChapters: Tutorial[];
  setActiveCourse: (courseId: string) => void;
  setCurrentLocation: (chapterId: string, lessonId: string) => void;
  showQuizForChapter: (chapterId: string) => void;
  setQuizScore: (quizId: string, score: number, answers: Record<string, string[]>) => void;
  goToNextLesson: () => void;
  goToPreviousLesson: () => void;
  resetActiveCourseProgress: () => void;
  resetChapter: (chapterId: string) => void;
  areAllLessonsInChapterCompleted: (chapterId: string) => boolean;
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
    const [globalProgress, setGlobalProgress] = useLocalStorage<GlobalProgress>('tutorial-progress', {}, {
        serializer: (value) => JSON.stringify(value, replacer),
        deserializer: (value) => {
            const parsed = JSON.parse(value);
            for (const courseId in parsed) {
                if (parsed[courseId].completedLessons) {
                    parsed[courseId].completedLessons = new Set(parsed[courseId].completedLessons);
                }
            }
            return parsed;
        },
    });
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

    const setActiveCourse = useCallback((courseId: string) => {
        setActiveCourseId(courseId);
    }, []);

    const course = useMemo(() => activeCourseId ? COURSES.find(c => c.id === activeCourseId) : undefined, [activeCourseId]);
    const courseChapters = useMemo(() => activeCourseId ? TUTORIALS.filter(t => t.courseId === activeCourseId) : [], [activeCourseId]);
    const progress = useMemo(() => activeCourseId ? (globalProgress[activeCourseId] || initialCourseProgress) : initialCourseProgress, [globalProgress, activeCourseId]);

    const updateActiveCourseProgress = useCallback((progressUpdater: (prev: CourseProgress) => CourseProgress) => {
        if (!activeCourseId) return;
        setGlobalProgress(prev => ({
            ...prev,
            [activeCourseId]: progressUpdater(prev[activeCourseId] || initialCourseProgress),
        }));
    }, [activeCourseId, setGlobalProgress]);

    const setCurrentLocation = useCallback((chapterId: string, lessonId: string) => {
        updateActiveCourseProgress(prev => ({ ...prev, currentChapterId: chapterId, currentLessonId: lessonId, currentView: 'lesson' }));
    }, [updateActiveCourseProgress]);

    const showQuizForChapter = useCallback((chapterId: string) => {
        updateActiveCourseProgress(prev => {
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
    }, [updateActiveCourseProgress]);

    const setQuizScore = useCallback((quizId: string, score: number, answers: Record<string, string[]>) => {
        updateActiveCourseProgress(prev => {
            const quiz = QUIZZES[quizId];
            if (!quiz) return { ...prev, quizScores: { ...prev.quizScores, [quizId]: score } };

            const passed = score >= quiz.passingScore;
            const newCompleted = new Set(prev.completedLessons);
            
            const newAttempts = { ...prev.quizAttempts, [quizId]: (prev.quizAttempts?.[quizId] || 0) + 1 };

            if (passed) {
                const chapter = courseChapters.find(c => c.id === quizId);
                if (chapter) {
                    chapter.lessons.forEach(lesson => newCompleted.add(lesson.id));
                }
            }
            
            return {
                ...prev,
                quizScores: { ...prev.quizScores, [quizId]: score },
                quizAttempts: newAttempts,
                completedLessons: newCompleted,
                quizAnswers: { ...prev.quizAnswers, [quizId]: answers },
            };
        });
    }, [updateActiveCourseProgress, courseChapters]);

    const goToNextLesson = useCallback(() => {
        if (!activeCourseId || !courseChapters.length) return;
        updateActiveCourseProgress(prev => {
            if (!prev.currentChapterId || !prev.currentLessonId) return prev;
    
            const newCompleted = new Set(prev.completedLessons);
            newCompleted.add(prev.currentLessonId);
    
            const chapterIndex = courseChapters.findIndex(c => c.id === prev.currentChapterId);
            if (chapterIndex === -1) return prev;
            
            const currentChapter = courseChapters[chapterIndex];
            const lessonIndex = currentChapter.lessons.findIndex(l => l.id === prev.currentLessonId);
            if (lessonIndex === -1) return prev;
    
            const isLastLesson = lessonIndex === currentChapter.lessons.length - 1;
    
            if (!isLastLesson) {
                return { ...prev, currentLessonId: currentChapter.lessons[lessonIndex + 1].id, completedLessons: newCompleted, currentView: 'lesson' };
            }
            
            const quiz = QUIZZES[currentChapter.id];
            const score = prev.quizScores[currentChapter.id] ?? 0;
            const passed = score >= (quiz?.passingScore ?? 80);
            
            if (chapterIndex < courseChapters.length - 1 && passed) {
                const nextChapter = courseChapters[chapterIndex + 1];
                return { ...prev, currentChapterId: nextChapter.id, currentLessonId: nextChapter.lessons[0].id, completedLessons: newCompleted, currentView: 'lesson' };
            }
            
            return { ...prev, completedLessons: newCompleted }; // Stay on last lesson if quiz not passed or it's the last chapter
        });
    }, [activeCourseId, courseChapters, updateActiveCourseProgress]);

    const goToPreviousLesson = useCallback(() => {
        if (!activeCourseId || !courseChapters.length) return;
        updateActiveCourseProgress(prev => {
            if (!prev.currentChapterId || !prev.currentLessonId) return prev;

            const chapterIndex = courseChapters.findIndex(c => c.id === prev.currentChapterId);
            if (chapterIndex === -1) return prev;
            
            const currentChapter = courseChapters[chapterIndex];
            const lessonIndex = currentChapter.lessons.findIndex(l => l.id === prev.currentLessonId);
            if (lessonIndex === -1) return prev;

            if (lessonIndex > 0) {
                return { ...prev, currentLessonId: currentChapter.lessons[lessonIndex - 1].id, currentView: 'lesson' };
            }
            
            if (chapterIndex > 0) {
                const prevChapter = courseChapters[chapterIndex - 1];
                return { ...prev, currentChapterId: prevChapter.id, currentLessonId: prevChapter.lessons[prevChapter.lessons.length - 1].id, currentView: 'lesson' };
            }
            
            return prev;
        });
    }, [activeCourseId, courseChapters, updateActiveCourseProgress]);

    const resetActiveCourseProgress = useCallback(() => {
        if (!activeCourseId) return;
        updateActiveCourseProgress(() => initialCourseProgress);
    }, [activeCourseId, updateActiveCourseProgress]);

    const resetChapter = useCallback((chapterId: string) => {
        updateActiveCourseProgress(prev => {
            const chapterToReset = courseChapters.find(c => c.id === chapterId);
            if (!chapterToReset) return prev;

            const newCompleted = new Set(prev.completedLessons);
            chapterToReset.lessons.forEach(lesson => newCompleted.delete(lesson.id));
            
            const { [chapterId]: _, ...newQuizScores } = prev.quizScores;
            const { [chapterId]: __, ...newQuizAttempts } = prev.quizAttempts;
            const { [chapterId]: ___, ...newQuizAnswers } = prev.quizAnswers;

            return {
                ...prev,
                quizScores: newQuizScores,
                quizAttempts: newQuizAttempts,
                completedLessons: newCompleted,
                quizAnswers: newQuizAnswers,
            };
        });
    }, [updateActiveCourseProgress, courseChapters]);
    
    const areAllLessonsInChapterCompleted = useCallback((chapterId: string): boolean => {
        const chapter = courseChapters.find(c => c.id === chapterId);
        if (!chapter) return false;
        return chapter.lessons.every(lesson => progress.completedLessons.has(lesson.id));
    }, [progress.completedLessons, courseChapters]);

    const value = useMemo(() => {
        // --- Global Stats Calculation ---
        let globalTotalLessons = 0;
        let globalTotalCompleted = 0;
        const allPassedScores: number[] = [];
        const allAttemptsForPassedQuizzes: number[] = [];

        Object.keys(globalProgress).forEach(courseId => {
            const courseProgressData = globalProgress[courseId];
            if (!courseProgressData) return;
            
            const chaptersForThisCourse = TUTORIALS.filter(t => t.courseId === courseId);
            const lessonsForThisCourse = chaptersForThisCourse.reduce((acc, chap) => acc + chap.lessons.length, 0);
            
            globalTotalLessons += lessonsForThisCourse;
            globalTotalCompleted += courseProgressData.completedLessons.size;
    
            const { quizScores, quizAttempts } = courseProgressData;
            const passedQuizIds = Object.keys(quizScores).filter(quizId => (QUIZZES[quizId] && quizScores[quizId] >= QUIZZES[quizId].passingScore));
            
            const passedScores = passedQuizIds.map(id => quizScores[id]);
            allPassedScores.push(...passedScores);
    
            const attempts = passedQuizIds.map(id => quizAttempts[id] || 1);
            allAttemptsForPassedQuizzes.push(...attempts);
        });
    
        const globalOverallProgress = globalTotalLessons > 0 ? (globalTotalCompleted / globalTotalLessons) * 100 : 0;
        const globalAverageQuizScore = allPassedScores.length > 0 ? allPassedScores.reduce((a, b) => a + b, 0) / allPassedScores.length : 0;
        const globalMasteryIndex = allAttemptsForPassedQuizzes.length > 0 ? allAttemptsForPassedQuizzes.reduce((a, b) => a + b, 0) / allAttemptsForPassedQuizzes.length : 0;

        // --- Active Course Specifics ---
        const currentChapter = courseChapters.find(t => t.id === progress.currentChapterId);
        const currentLesson = currentChapter?.lessons.find(l => l.id === progress.currentLessonId);
        
        const chapterIndex = courseChapters.findIndex(c => c.id === progress.currentChapterId);
        const lessonIndex = currentChapter?.lessons.findIndex(l => l.id === progress.currentLessonId);
        const isFirstLessonInTutorial = chapterIndex === 0 && lessonIndex === 0;
        const isLastLessonInTutorial = chapterIndex === courseChapters.length - 1 && lessonIndex === (currentChapter?.lessons.length ?? 0) - 1;

        return { 
            progress,
            globalProgress,
            course,
            courseChapters,
            setActiveCourse,
            setCurrentLocation,
            showQuizForChapter,
            setQuizScore,
            goToNextLesson,
            goToPreviousLesson,
            resetActiveCourseProgress,
            resetChapter,
            areAllLessonsInChapterCompleted,
            currentChapter,
            currentLesson,
            currentView: progress.currentView,
            totalLessons: globalTotalLessons,
            totalCompleted: globalTotalCompleted,
            overallProgress: globalOverallProgress,
            averageQuizScore: globalAverageQuizScore,
            masteryIndex: globalMasteryIndex,
            isFirstLessonInTutorial,
            isLastLessonInTutorial,
        };
    }, [progress, globalProgress, course, courseChapters, setActiveCourse, setCurrentLocation, showQuizForChapter, setQuizScore, goToNextLesson, goToPreviousLesson, resetActiveCourseProgress, resetChapter, areAllLessonsInChapterCompleted]);

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

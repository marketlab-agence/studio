
'use client';
import React, { createContext, useContext, ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import type { CourseProgress, GlobalProgress, Tutorial } from '@/types/tutorial.types';
import type { CourseInfo } from '@/types/course.types';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const initialCourseProgress: CourseProgress = {
    quizScores: {},
    quizAttempts: {},
    completedLessons: [],
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
  setActiveCourseAndData: (course: CourseInfo, chapters: Tutorial[]) => void;
  setCurrentLocation: (chapterId: string, lessonId: string) => void;
  showQuizForChapter: (chapterId: string) => void;
  setQuizScore: (quizId: string, score: number, answers: Record<string, string[]>) => Promise<void>;
  goToNextLesson: () => void;
  goToPreviousLesson: () => void;
  resetActiveCourseProgress: () => void;
  resetChapter: (chapterId: string) => void;
  areAllLessonsInChapterCompleted: (chapterId: string) => boolean;
  currentChapter: Tutorial | undefined;
  currentLesson: Tutorial['lessons'][0] | undefined;
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

export function TutorialProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [globalProgress, setGlobalProgress] = useState<GlobalProgress>({});
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [course, setCourse] = useState<CourseInfo | undefined>();
    const [courseChapters, setCourseChapters] = useState<Tutorial[]>([]);
    const [quizzes, setQuizzes] = useState<Record<string, any>>({});
    
    // Fetch user progress from Firestore on user login
    useEffect(() => {
        const fetchProgress = async () => {
            if (user?.uid && db) {
                const progressColRef = collection(db, 'users', user.uid, 'progress');
                const querySnapshot = await getDocs(progressColRef);
                const loadedProgress: GlobalProgress = {};
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as CourseProgress;
                    loadedProgress[doc.id] = data;
                });
                setGlobalProgress(loadedProgress);
            } else {
                setGlobalProgress({}); // Clear progress on logout
            }
        };
        fetchProgress();
    }, [user]);

    const progress = useMemo(() => activeCourseId ? (globalProgress[activeCourseId] || initialCourseProgress) : initialCourseProgress, [globalProgress, activeCourseId]);

    const setActiveCourseAndData = useCallback(async (newCourse: CourseInfo, newChapters: Tutorial[]) => {
        setActiveCourseId(newCourse.id);
        setCourse(newCourse);
        setCourseChapters(newChapters);
        // Fetch quizzes for the course
        if(db) {
            const quizzesCol = collection(db, 'courses', newCourse.id, 'quizzes');
            const quizzesSnap = await getDocs(quizzesCol);
            const quizzesData: Record<string, any> = {};
            quizzesSnap.forEach(doc => {
                quizzesData[doc.id] = doc.data();
            });
            setQuizzes(quizzesData);
        }
    }, []);

    const updateProgressInFirestore = useCallback(async (progressUpdater: (prev: CourseProgress) => CourseProgress) => {
        if (!user || !activeCourseId || !db) return;
        
        const currentProgress = globalProgress[activeCourseId] || initialCourseProgress;
        const newProgress = progressUpdater(currentProgress);
        
        const progressDocRef = doc(db, 'users', user.uid, 'progress', activeCourseId);
        await setDoc(progressDocRef, newProgress, { merge: true });
        
        // Update local state to reflect changes immediately
        setGlobalProgress(prev => ({ ...prev, [activeCourseId]: newProgress }));
    }, [user, activeCourseId, globalProgress, setGlobalProgress]);


    const setCurrentLocation = useCallback((chapterId: string, lessonId: string) => {
        updateProgressInFirestore(prev => ({ ...prev, currentChapterId: chapterId, currentLessonId: lessonId, currentView: 'lesson' }));
    }, [updateProgressInFirestore]);

    const showQuizForChapter = useCallback((chapterId: string) => {
        updateProgressInFirestore(prev => {
            let completed = prev.completedLessons || [];
            if (prev.currentLessonId && !completed.includes(prev.currentLessonId)) {
                completed = [...completed, prev.currentLessonId];
            }
            return {
                ...prev,
                currentChapterId: chapterId,
                currentLessonId: prev.currentLessonId,
                currentView: 'quiz',
                completedLessons: completed,
            };
        });
    }, [updateProgressInFirestore]);

    const setQuizScore = useCallback(async (quizId: string, score: number, answers: Record<string, string[]>) => {
        await updateProgressInFirestore(prev => {
            const quiz = quizzes[quizId];
            if (!quiz) return { ...prev, quizScores: { ...prev.quizScores, [quizId]: score } };

            const passed = score >= quiz.passingScore;
            let completed = prev.completedLessons || [];
            
            if (passed) {
                const chapter = courseChapters.find(c => c.id === quizId);
                if (chapter) {
                    const newLessons = chapter.lessons.map(l => l.id).filter(lId => !completed.includes(lId));
                    completed = [...completed, ...newLessons];
                }
            }
            
            return {
                ...prev,
                quizScores: { ...prev.quizScores, [quizId]: score },
                quizAttempts: { ...prev.quizAttempts, [quizId]: (prev.quizAttempts?.[quizId] || 0) + 1 },
                completedLessons: completed,
                quizAnswers: { ...prev.quizAnswers, [quizId]: answers },
            };
        });
    }, [updateProgressInFirestore, quizzes, courseChapters]);

    const goToNextLesson = useCallback(() => {
        if (!activeCourseId || !courseChapters.length) return;
        
        const { currentChapterId, currentLessonId } = progress;
        if (!currentChapterId || !currentLessonId) return;

        let completed = progress.completedLessons || [];
        if (!completed.includes(currentLessonId)) {
            completed = [...completed, currentLessonId];
        }

        const chapterIndex = courseChapters.findIndex(c => c.id === currentChapterId);
        if (chapterIndex === -1) return;
        
        const currentChapter = courseChapters[chapterIndex];
        const lessonIndex = currentChapter.lessons.findIndex(l => l.id === currentLessonId);

        if (lessonIndex > -1 && lessonIndex < currentChapter.lessons.length - 1) {
            // Next lesson in same chapter
            updateProgressInFirestore(prev => ({ ...prev, completedLessons: completed, currentLessonId: currentChapter.lessons[lessonIndex + 1].id }));
        } else {
            // Last lesson of chapter, check if quiz is passed
            const quiz = quizzes[currentChapter.id];
            const score = progress.quizScores[currentChapter.id] ?? 0;
            const passed = score >= (quiz?.passingScore ?? 80);

            if (passed && chapterIndex < courseChapters.length - 1) {
                // Move to next chapter
                const nextChapter = courseChapters[chapterIndex + 1];
                updateProgressInFirestore(prev => ({
                    ...prev,
                    completedLessons: completed,
                    currentChapterId: nextChapter.id,
                    currentLessonId: nextChapter.lessons[0].id,
                }));
            } else {
                updateProgressInFirestore(prev => ({ ...prev, completedLessons: completed }));
            }
        }
    }, [activeCourseId, courseChapters, progress, quizzes, updateProgressInFirestore]);
    
    const goToPreviousLesson = useCallback(() => {
        if (!activeCourseId || !courseChapters.length || !progress.currentChapterId || !progress.currentLessonId) return;
        
        const chapterIndex = courseChapters.findIndex(c => c.id === progress.currentChapterId);
        const currentChapter = courseChapters[chapterIndex];
        const lessonIndex = currentChapter.lessons.findIndex(l => l.id === progress.currentLessonId);

        if (lessonIndex > 0) {
            setCurrentLocation(currentChapter.id, currentChapter.lessons[lessonIndex - 1].id);
        } else if (chapterIndex > 0) {
            const prevChapter = courseChapters[chapterIndex - 1];
            setCurrentLocation(prevChapter.id, prevChapter.lessons[prevChapter.lessons.length - 1].id);
        }
    }, [activeCourseId, courseChapters, progress, setCurrentLocation]);

    const resetActiveCourseProgress = useCallback(() => {
        if (!user || !activeCourseId || !db) return;
        const progressDocRef = doc(db, 'users', user.uid, 'progress', activeCourseId);
        setDoc(progressDocRef, initialCourseProgress).then(() => {
             setGlobalProgress(prev => ({ ...prev, [activeCourseId]: initialCourseProgress }));
        });
    }, [user, activeCourseId, setGlobalProgress]);

    const resetChapter = useCallback((chapterId: string) => {
        updateProgressInFirestore(prev => {
            const chapterToReset = courseChapters.find(c => c.id === chapterId);
            if (!chapterToReset) return prev;

            const completed = prev.completedLessons || [];
            const newCompleted = completed.filter(lessonId => !chapterToReset.lessons.some(l => l.id === lessonId));
            
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
    }, [updateProgressInFirestore, courseChapters]);
    
    const areAllLessonsInChapterCompleted = useCallback((chapterId: string): boolean => {
        const chapter = courseChapters.find(c => c.id === chapterId);
        if (!chapter) return false;
        const completed = progress.completedLessons || [];
        return chapter.lessons.every(lesson => completed.includes(lesson.id));
    }, [progress.completedLessons, courseChapters]);

    const value = useMemo(() => {
        // --- Global Stats Calculation ---
        let globalTotalLessons = 0;
        let globalTotalCompleted = 0;
        const allPassedScores: number[] = [];
        const allAttemptsForPassedQuizzes: number[] = [];

        Object.entries(globalProgress).forEach(([courseId, courseProgressData]) => {
            const currentCourse = course; // Assuming active course for now, might need to load all courses
            if (!currentCourse || !courseProgressData) return;

            const chaptersForThisCourse = courseChapters.filter(t => t.courseId === courseId);
            const lessonsForThisCourse = chaptersForThisCourse.reduce((acc, chap) => acc + chap.lessons.length, 0);
            
            globalTotalLessons += lessonsForThisCourse;
            globalTotalCompleted += (courseProgressData.completedLessons || []).length;
    
            const { quizScores, quizAttempts } = courseProgressData;
            if (quizScores && quizzes) {
                const passedQuizIds = Object.keys(quizScores).filter(quizId => (quizzes[quizId] && quizScores[quizId] >= quizzes[quizId].passingScore));
                const passedScores = passedQuizIds.map(id => quizScores[id]);
                allPassedScores.push(...passedScores);
        
                const attempts = passedQuizIds.map(id => quizAttempts?.[id] || 1);
                allAttemptsForPassedQuizzes.push(...attempts);
            }
        });
    
        const globalOverallProgress = globalTotalLessons > 0 ? (globalTotalCompleted / globalTotalLessons) * 100 : 0;
        const globalAverageQuizScore = allPassedScores.length > 0 ? allPassedScores.reduce((a, b) => a + b, 0) / allPassedScores.length : 0;
        const globalMasteryIndex = allAttemptsForPassedQuizzes.length > 0 ? allAttemptsForPassedQuizzes.reduce((a, b) => a + b, 0) / allAttemptsForPassedQuizzes.length : 0;
        
        const currentChapter = courseChapters.find(t => t.id === progress.currentChapterId);
        const currentLesson = currentChapter?.lessons.find(l => l.id === progress.currentLessonId);
        
        const chapterIndex = courseChapters.findIndex(c => c.id === progress.currentChapterId);
        const lessonIndex = currentChapter?.lessons.findIndex(l => l.id === progress.currentLessonId);
        const isFirstLessonInTutorial = chapterIndex === 0 && lessonIndex === 0;
        const isLastLessonInTutorial = chapterIndex === courseChapters.length - 1 && lessonIndex === (currentChapter?.lessons.length ?? 0) - 1;

        return { 
            progress: {
                ...progress,
                completedLessons: new Set(progress.completedLessons || [])
            },
            globalProgress,
            course,
            courseChapters,
            setActiveCourseAndData,
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
    }, [progress, globalProgress, course, courseChapters, setActiveCourseAndData, quizzes, setCurrentLocation, showQuizForChapter, setQuizScore, goToNextLesson, goToPreviousLesson, resetActiveCourseProgress, resetChapter, areAllLessonsInChapterCompleted]);

    const contextValueWithSets = {
        ...value,
        progress: {
            ...value.progress,
            completedLessons: new Set(value.progress.completedLessons)
        }
    };
    // The context still needs to be updated for consumers that expect a Set.
    // However, the state that is persisted to firestore will use arrays.
    
    return (
        <TutorialContext.Provider value={contextValueWithSets as any}>
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

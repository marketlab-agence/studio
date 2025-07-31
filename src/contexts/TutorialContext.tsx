
'use client';
import React,
{
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useState,
  useEffect
} from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type
{
  CourseProgress,
  GlobalProgress,
  Tutorial
} from '@/types/tutorial.types';
import type { CourseInfo } from '@/types/course.types';
import type { Quiz } from '@/types/tutorial.types';

const getChapterNumber = (title: string) =>
{
  const match = title.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
};

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
  isLoading: boolean;
  progress: CourseProgress;
  globalProgress: GlobalProgress;
  course: CourseInfo | undefined;
  courseChapters: Tutorial[];
  allQuizzesData: Record<string, Quiz>;
  activeCourseId: string | null;
  setActiveCourse: (courseId: string) => void;
  setActiveCourseAndData: (course: CourseInfo, chapters: Tutorial[]) => void;
  setCurrentLocation: (chapterId: string, lessonId: string) => void;
  showQuizForChapter: (chapterId: string) => void;
  setQuizScore: (quizId: string, score: number, answers: Record<string, string[]>) => void;
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

const reviver = (key: string, value: any) =>
{
  if (key === 'completedLessons' && Array.isArray(value)) return new Set(value);
  return value;
};

export function TutorialProvider({ children }: { children: ReactNode })
{
  const { user, loading: authLoading } = useAuth();
  const [globalProgress, setGlobalProgress] = useState<GlobalProgress>({});
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  // Load progress from Firestore on user login
  useEffect(() => {
    const loadProgress = async () => {
      if (user && db) {
        setIsProgressLoading(true);
        const progressDocRef = doc(db, 'users', user.uid, 'progress', 'all');
        const progressDoc = await getDoc(progressDocRef);
        if (progressDoc.exists()) {
          const rawData = progressDoc.data();
          const parsedData = JSON.parse(JSON.stringify(rawData), reviver);
          setGlobalProgress(parsedData);
        } else {
          setGlobalProgress({});
        }
        setIsProgressLoading(false);
      } else if (!user) {
        setGlobalProgress({});
        setIsProgressLoading(false);
      }
    };
    if(!authLoading) {
        loadProgress();
    }
  }, [user, authLoading]);

  // Save progress to Firestore whenever it changes
  useEffect(() => {
    const saveProgress = async () => {
      if (user && db && Object.keys(globalProgress).length > 0 && !isProgressLoading) {
        const progressDocRef = doc(db, 'users', user.uid, 'progress', 'all');
        // We need to convert Sets to arrays for Firestore
        const serializedProgress = JSON.parse(JSON.stringify(globalProgress, (key, value) => {
            if (value instanceof Set) {
                return Array.from(value);
            }
            return value;
        }));
        await setDoc(progressDocRef, serializedProgress, { merge: true });
      }
    };
    saveProgress();
  }, [globalProgress, user, isProgressLoading]);


  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseInfo | undefined>();
  const [courseChapters, setCourseChapters] = useState<Tutorial[]>([]);

  const [allQuizzesData, setAllQuizzesData] = useState<Record<string, Quiz>>({});
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() =>
  {
    const fetchInitialData = async () =>
    {
      setIsDataLoading(true);
      try
      {
        const quizzesRes = await fetch('/api/quizzes');
        if (quizzesRes.ok) setAllQuizzesData(await quizzesRes.json());
      } catch (error)
      {
        console.error("Error fetching initial data:", error);
      } finally
      {
        setIsDataLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const setActiveCourseAndData = useCallback((newCourse: CourseInfo, newChapters: Tutorial[]) =>
  {
    setActiveCourseId(newCourse.id);
    setCourse(newCourse);
    const sortedChapters = [...newChapters].sort((a, b) => getChapterNumber(a.title) - getChapterNumber(b.title));
    setCourseChapters(sortedChapters);
  }, []);

  const progress = useMemo(() => activeCourseId ? (globalProgress[activeCourseId] || initialCourseProgress) : initialCourseProgress, [globalProgress, activeCourseId]);

  const updateActiveCourseProgress = useCallback((progressUpdater: (prev: CourseProgress) => CourseProgress) =>
  {
    if (!activeCourseId) return;
    setGlobalProgress(prev => ({ ...prev, [activeCourseId]: progressUpdater(prev[activeCourseId] || initialCourseProgress) }));
  }, [activeCourseId]);

  const setCurrentLocation = useCallback((chapterId: string, lessonId: string) =>
  {
    updateActiveCourseProgress(prev => ({ ...prev, currentChapterId: chapterId, currentLessonId: lessonId, currentView: 'lesson' }));
  }, [updateActiveCourseProgress]);

  const showQuizForChapter = useCallback((chapterId: string) =>
  {
    updateActiveCourseProgress(prev =>
    {
      const newCompleted = prev.currentLessonId ? new Set(prev.completedLessons).add(prev.currentLessonId) : prev.completedLessons;
      return { ...prev, currentChapterId: chapterId, currentLessonId: prev.currentLessonId, currentView: 'quiz', completedLessons: newCompleted };
    });
  }, [updateActiveCourseProgress]);

  const setQuizScore = useCallback((quizId: string, score: number, answers: Record<string, string[]>) =>
  {
    updateActiveCourseProgress(prev =>
    {
      const quiz = allQuizzesData[quizId];
      if (!quiz) return { ...prev, quizScores: { ...prev.quizScores, [quizId]: score } };

      const passed = score >= quiz.passingScore;
      const newCompleted = new Set(prev.completedLessons);
      if (passed)
      {
        const chapter = courseChapters.find(c => c.id === quizId);
        if (chapter) chapter.lessons.forEach(lesson => newCompleted.add(lesson.id));
      }

      return { ...prev, quizScores: { ...prev.quizScores, [quizId]: score }, quizAttempts: { ...prev.quizAttempts, [quizId]: (prev.quizAttempts?.[quizId] || 0) + 1 }, completedLessons: newCompleted, quizAnswers: { ...prev.quizAnswers, [quizId]: answers } };
    });
  }, [updateActiveCourseProgress, courseChapters, allQuizzesData]);

  const goToNextLesson = useCallback(() =>
  {
    if (!activeCourseId || !courseChapters.length || !progress.currentChapterId) return;
    
    updateActiveCourseProgress(prev => {
        const newCompleted = prev.currentLessonId ? new Set(prev.completedLessons).add(prev.currentLessonId) : prev.completedLessons;

        const chapterIndex = courseChapters.findIndex(c => c.id === prev.currentChapterId);
        if (chapterIndex === -1) return { ...prev, completedLessons: newCompleted };

        const currentChapter = courseChapters[chapterIndex];
        const lessonIndex = prev.currentLessonId ? currentChapter.lessons.findIndex(l => l.id === prev.currentLessonId) : -1;

        if (lessonIndex > -1 && lessonIndex < currentChapter.lessons.length - 1) {
            return {
                ...prev,
                currentLessonId: currentChapter.lessons[lessonIndex + 1].id,
                currentView: 'lesson',
                completedLessons: newCompleted
            };
        }
        
        if (chapterIndex < courseChapters.length - 1) {
             const nextChapter = courseChapters[chapterIndex + 1];
             if (nextChapter && nextChapter.lessons.length > 0) {
                 return {
                     ...prev,
                     currentChapterId: nextChapter.id,
                     currentLessonId: nextChapter.lessons[0].id,
                     currentView: 'lesson',
                     completedLessons: newCompleted
                 };
             }
        }
        return { ...prev, completedLessons: newCompleted };
    });
  }, [activeCourseId, courseChapters, progress.currentChapterId, updateActiveCourseProgress]);


  const goToPreviousLesson = useCallback(() =>
  {
    if (!activeCourseId || !courseChapters.length || !progress.currentChapterId) return;
    updateActiveCourseProgress(prev =>
    {
        if (prev.currentView === 'quiz') {
            const currentChapter = courseChapters.find(c => c.id === prev.currentChapterId);
            if (currentChapter && currentChapter.lessons.length > 0) {
                 return { ...prev, currentLessonId: currentChapter.lessons[currentChapter.lessons.length - 1].id, currentView: 'lesson' };
            }
        }

      const chapterIndex = courseChapters.findIndex(c => c.id === prev.currentChapterId);
      if (chapterIndex === -1) return prev;
      
      const currentChapter = courseChapters[chapterIndex];
      const lessonIndex = prev.currentLessonId ? currentChapter.lessons.findIndex(l => l.id === prev.currentLessonId) : -1;

      if (lessonIndex > 0) return { ...prev, currentLessonId: currentChapter.lessons[lessonIndex - 1].id, currentView: 'lesson' };

      if (chapterIndex > 0)
      {
        const prevChapter = courseChapters[chapterIndex - 1];
        return { ...prev, currentChapterId: prevChapter.id, currentLessonId: prevChapter.lessons[prevChapter.lessons.length - 1].id, currentView: 'lesson' };
      }
      return prev;
    });
  }, [activeCourseId, courseChapters, progress.currentChapterId, updateActiveCourseProgress]);

  const resetActiveCourseProgress = useCallback(() =>
  {
    if (!activeCourseId) return;
    updateActiveCourseProgress(() => initialCourseProgress);
  }, [activeCourseId, updateActiveCourseProgress]);

  const resetChapter = useCallback((chapterId: string) =>
  {
    updateActiveCourseProgress(prev =>
    {
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

  const value = useMemo(() =>
  {
    const currentChapter = courseChapters.find(t => t.id === progress.currentChapterId);
    const currentLesson = currentChapter?.lessons.find(l => l.id === progress.currentLessonId);

    const chapterIndex = progress.currentChapterId ? courseChapters.findIndex(c => c.id === progress.currentChapterId) : -1;
    const lessonIndex = (currentChapter && progress.currentLessonId) ? currentChapter.lessons.findIndex(l => l.id === progress.currentLessonId) : -1;

    const isFirstLessonInTutorial = chapterIndex <= 0 && lessonIndex <= 0;
    const isLastLessonInTutorial = chapterIndex === courseChapters.length - 1 && lessonIndex === (currentChapter?.lessons.length ?? 0) - 1;

    const totalLessons = courseChapters.reduce((acc, chap) => acc + chap.lessons.length, 0);
    const totalCompleted = progress.completedLessons.size;

    const overallProgress = totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0;
    
    const { quizScores, quizAttempts } = progress;
    const allAttemptedScores = Object.values(quizScores);
    const allAttemptsForPassedQuizzes = Object.keys(quizScores).filter(quizId => (allQuizzesData[quizId] && quizScores[quizId] >= allQuizzesData[quizId].passingScore)).map(id => quizAttempts[id] || 1);
    
    const averageQuizScore = allAttemptedScores.length > 0 ? allAttemptedScores.reduce((a, b) => a + b, 0) / allAttemptedScores.length : 0;
    const masteryIndex = allAttemptsForPassedQuizzes.length > 0 ? allAttemptsForPassedQuizzes.reduce((a, b) => a + b, 0) / allAttemptsForPassedQuizzes.length : 0;

    return {
      isLoading: isDataLoading || authLoading || isProgressLoading,
      progress,
      globalProgress,
      course,
      courseChapters,
      allQuizzesData,
      activeCourseId,
      setActiveCourse: setActiveCourseId,
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
      totalLessons: totalLessons,
      totalCompleted: totalCompleted,
      overallProgress: overallProgress,
      averageQuizScore: averageQuizScore,
      masteryIndex: masteryIndex,
      isFirstLessonInTutorial,
      isLastLessonInTutorial,
    };
  }, [
    isDataLoading,
    authLoading,
    isProgressLoading,
    progress,
    globalProgress,
    course,
    courseChapters,
    activeCourseId,
    setActiveCourseAndData,
    setCurrentLocation,
    showQuizForChapter,
    setQuizScore,
    goToNextLesson,
    goToPreviousLesson,
    resetActiveCourseProgress,
    resetChapter,
    areAllLessonsInChapterCompleted,
    allQuizzesData
  ]);

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial()
{
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within a TutorialProvider');
  return context;
}

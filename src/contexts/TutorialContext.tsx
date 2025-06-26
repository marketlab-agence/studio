'use client';
import React, { createContext, useContext, ReactNode, useMemo, useCallback, useState } from 'react';
import type { UserProgress, CommandHistoryItem } from '@/types/tutorial.types';
import type { FileNode } from '@/types/git.types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TUTORIALS } from '@/lib/tutorials';
import { executeCommand } from '@/lib/git-simulation';
import { explainCommand } from '@/app/actions';

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
  // Simulation state
  filesystem: FileNode[];
  commandHistory: CommandHistoryItem[];
  isTerminalLoading: boolean;
  runCommandInTerminal: (command: string) => Promise<void>;
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

const INITIAL_FILESYSTEM: FileNode[] = [];

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

    // Simulation state
    const [filesystem, setFilesystem] = useState<FileNode[]>(INITIAL_FILESYSTEM);
    const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
    const [isTerminalLoading, setIsTerminalLoading] = useState(false);

    const runCommandInTerminal = useCallback(async (command: string) => {
      setIsTerminalLoading(true);

      // Add command to history
      setCommandHistory(prev => [...prev, { type: 'command', content: command }]);

      // Simulate command execution
      const { newState, output: commandOutput } = executeCommand(command, filesystem);
      setFilesystem(newState);
      
      if (commandOutput) {
        setCommandHistory(prev => [...prev, { type: 'output', content: commandOutput }]);
      }
      
      // Get AI explanation
      const context = TUTORIALS.find(t => t.id === progress.currentChapterId)?.lessons.find(l => l.id === progress.currentLessonId)?.title || "Contexte général";
      const aiResponse = await explainCommand(command, context);
      if (aiResponse.explanation) {
          setCommandHistory(prev => [...prev, { type: 'ai', content: aiResponse.explanation }]);
      }

      setIsTerminalLoading(false);
    }, [filesystem, progress.currentChapterId, progress.currentLessonId]);

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
        const p = (typeof progress === 'object' && progress !== null) ? progress : initialProgress;

        const currentChapter = TUTORIALS.find(t => t.id === p.currentChapterId);
        const currentLesson = currentChapter?.lessons.find(l => l.id === p.currentLessonId);

        const totalLessons = TUTORIALS.reduce((acc, curr) => acc + curr.lessons.length, 0);
        const totalCompleted = p.completedLessons?.size || 0;
        const overallProgress = totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0;

        return { 
            progress: p, 
            setCurrentLocation,
            completeLesson,
            setQuizScore,
            currentChapter,
            currentLesson,
            totalLessons,
            totalCompleted,
            overallProgress,
            filesystem,
            commandHistory,
            isTerminalLoading,
            runCommandInTerminal,
        };
    }, [progress, setCurrentLocation, completeLesson, setQuizScore, filesystem, commandHistory, isTerminalLoading, runCommandInTerminal]);


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

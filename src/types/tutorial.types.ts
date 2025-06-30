

export interface Tutorial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  objective: string;
  content: string; // Illustrative markdown content
  interactiveComponentName?: string;
  visualComponentName?: string;
}

export interface Quiz {
    id: string;
    title: string;
    questions: Question[];
    passingScore: number;
    feedbackTiming?: 'immediate' | 'end';
}

export interface Question {
    id:string;
    text: string;
    answers: Answer[];
    isMultipleChoice?: boolean;
}

export interface Answer {
    id: string;
    text: string;
    isCorrect?: boolean;
}

export interface CourseProgress {
  quizScores: Record<string, number>;
  quizAttempts: Record<string, number>;
  completedLessons: Set<string>;
  currentChapterId: string | null;
  currentLessonId: string | null;
  currentView: 'lesson' | 'quiz';
  quizAnswers: Record<string, Record<string, string[]>>;
}

export type GlobalProgress = Record<string, CourseProgress>;

export type GenerateLessonContentOutput = {
  illustrativeContent: string;
  interactiveComponentName: string;
  visualComponentName: string;
};

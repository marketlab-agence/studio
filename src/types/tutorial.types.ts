export interface Tutorial {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown content
  command?: string;
  component?: React.ComponentType;
}

export interface Quiz {
    id: string;
    title: string;
    questions: Question[];
    passingScore: number;
}

export interface Question {
    id: string;
    text: string;
    answers: Answer[];
    isMultipleChoice?: boolean;
}

export interface Answer {
    id: string;
    text: string;
    isCorrect?: boolean;
}

export interface UserProgress {
  // chapterId -> score
  quizScores: Record<string, number>;
  // lessonId -> completed
  completedLessons: Set<string>;
  // last position
  currentChapterId: string | null;
  currentLessonId: string | null;
}

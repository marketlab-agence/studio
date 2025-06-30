
import type { Quiz } from '@/types/tutorial.types';
import quizzesData from '@/data/quizzes.json';

// Initialize with data from the JSON file. This is client-safe.
export let QUIZZES: Record<string, Quiz> = quizzesData as Record<string, Quiz>;

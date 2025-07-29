
import type { Quiz } from '@/types/tutorial.types';
import allQuizzes from '@/data/quizzes.json';
import { readData, writeData } from './file-system';

const FILE_PATH = 'src/data/quizzes.json';

// This is a synchronous import for client components that might need the basic data.
export const QUIZZES: Record<string, Quiz> = allQuizzes;

// This function can be called from server components or actions
export async function getQuizzes(): Promise<Record<string, Quiz>> {
    return readData<Record<string, Quiz>>(FILE_PATH, {});
}

// This function should only be called from server actions
export async function saveQuizzes(quizzes: Record<string, Quiz>): Promise<void> {
    await writeData(FILE_PATH, quizzes);
}

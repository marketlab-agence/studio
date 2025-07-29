
import type { Tutorial } from '@/types/tutorial.types';
import allTutorials from '@/data/tutorials.json';
import { readData, writeData } from './file-system';

const FILE_PATH = 'src/data/tutorials.json';

// This is a synchronous import for client components that might need the basic data.
export const TUTORIALS: Tutorial[] = allTutorials;

// This function can be called from server components or actions
export async function getTutorials(): Promise<Tutorial[]> {
    return readData<Tutorial[]>(FILE_PATH, []);
}

// This function should only be called from server actions
export async function saveTutorials(tutorials: Tutorial[]): Promise<void> {
    await writeData(FILE_PATH, tutorials);
}

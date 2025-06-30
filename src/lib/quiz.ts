
import type { Quiz } from '@/types/tutorial.types';
import quizzesData from '@/data/quizzes.json';

// Initialize with data from the JSON file. This is client-safe.
export let QUIZZES: Record<string, Quiz> = quizzesData as Record<string, Quiz>;

// The save function now uses dynamic imports for fs and path, making it server-side only at runtime.
export async function saveQuizzes() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataDirectory = path.join(process.cwd(), 'src/data');
    const quizzesFilePath = path.join(dataDirectory, 'quizzes.json');

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFileSync(quizzesFilePath, JSON.stringify(QUIZZES, null, 2));
  } catch (error) {
    console.error('Error saving quizzes.json:', error);
  }
}

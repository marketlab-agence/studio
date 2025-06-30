import type { Quiz } from '@/types/tutorial.types';
import fs from 'fs';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src/data');
const quizzesFilePath = path.join(dataDirectory, 'quizzes.json');

function readQuizzesFromFile(): Record<string, Quiz> {
  try {
    const fileContents = fs.readFileSync(quizzesFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading quizzes.json:', error);
    // Fallback to initial data
    return {
      'intro-to-git': {
        id: 'intro-to-git',
        title: 'Quiz: Introduction à Git',
        questions: [],
        passingScore: 80,
      }
    };
  }
}

export let QUIZZES: Record<string, Quiz> = readQuizzesFromFile();

export function saveQuizzes() {
  try {
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFileSync(quizzesFilePath, JSON.stringify(QUIZZES, null, 2));
    // Re-read to ensure the in-memory export is up-to-date
    QUIZZES = readQuizzesFromFile();
  } catch (error) {
    console.error('Error saving quizzes.json:', error);
  }
}

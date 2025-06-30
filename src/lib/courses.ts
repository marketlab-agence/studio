import type { CourseInfo } from '@/types/course.types';
import fs from 'fs';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src/data');
const coursesFilePath = path.join(dataDirectory, 'courses.json');

function readCoursesFromFile(): CourseInfo[] {
  try {
    const fileContents = fs.readFileSync(coursesFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading courses.json:', error);
    // This is a fallback if the file doesn't exist or is invalid
    return [
      {
        id: 'git-github-tutorial',
        title: 'Git & GitHub : Le Guide Complet',
        description: 'La compétence fondamentale pour tout développeur. De la première ligne de commande à la contribution open source.',
        status: 'Publié',
      }
    ];
  }
}

export let COURSES: CourseInfo[] = readCoursesFromFile();

export function saveCourses() {
  try {
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFileSync(coursesFilePath, JSON.stringify(COURSES, null, 2));
    // Re-read to ensure the in-memory export is up-to-date for subsequent calls in the same process
    COURSES = readCoursesFromFile();
  } catch (error) {
    console.error('Error saving courses.json:', error);
  }
}

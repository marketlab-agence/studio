import type { Tutorial } from '@/types/tutorial.types';
import fs from 'fs';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src/data');
const tutorialsFilePath = path.join(dataDirectory, 'tutorials.json');

function readTutorialsFromFile(): Tutorial[] {
  try {
    const fileContents = fs.readFileSync(tutorialsFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading tutorials.json, returning initial data:', error);
    // Fallback to initial data
    return [];
  }
}

export let TUTORIALS: Tutorial[] = readTutorialsFromFile();

export function saveTutorials() {
  try {
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFileSync(tutorialsFilePath, JSON.stringify(TUTORIALS, null, 2));
    // Re-read to ensure the in-memory export is up-to-date
    TUTORIALS = readTutorialsFromFile();
  } catch (error) {
    console.error('Error saving tutorials.json:', error);
  }
}

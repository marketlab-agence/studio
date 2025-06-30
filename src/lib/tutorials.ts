
import type { Tutorial } from '@/types/tutorial.types';
import tutorialsData from '@/data/tutorials.json';

// Initialize with data from the JSON file. This is client-safe.
export let TUTORIALS: Tutorial[] = tutorialsData as Tutorial[];

// The save function now uses dynamic imports for fs and path, making it server-side only at runtime.
export async function saveTutorials() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataDirectory = path.join(process.cwd(), 'src/data');
    const tutorialsFilePath = path.join(dataDirectory, 'tutorials.json');

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFileSync(tutorialsFilePath, JSON.stringify(TUTORIALS, null, 2));
  } catch (error) {
    console.error('Error saving tutorials.json:', error);
  }
}

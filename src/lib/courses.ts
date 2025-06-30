
import type { CourseInfo } from '@/types/course.types';
import coursesData from '@/data/courses.json';

// Initialize with data from the JSON file. This is client-safe.
export let COURSES: CourseInfo[] = coursesData as CourseInfo[];

// The save function now uses dynamic imports for fs and path, making it server-side only at runtime.
export async function saveCourses() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataDirectory = path.join(process.cwd(), 'src/data');
    const coursesFilePath = path.join(dataDirectory, 'courses.json');

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFileSync(coursesFilePath, JSON.stringify(COURSES, null, 2));
  } catch (error) {
    console.error('Error saving courses.json:', error);
  }
}

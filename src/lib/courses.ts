
import type { CourseInfo } from '@/types/course.types';
import allCourses from '@/data/courses.json';
import { readData, writeData } from './file-system';

const FILE_PATH = 'src/data/courses.json';

// This function can be called from server components or actions
export async function getCourses(): Promise<CourseInfo[]> {
    return readData<CourseInfo[]>(FILE_PATH, []);
}

// This function should only be called from server actions
export async function saveCourses(courses: CourseInfo[]): Promise<void> {
    await writeData(FILE_PATH, courses);
}

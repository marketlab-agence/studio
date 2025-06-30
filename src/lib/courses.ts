
import type { CourseInfo } from '@/types/course.types';
import coursesData from '@/data/courses.json';

// Initialize with data from the JSON file. This is client-safe.
export let COURSES: CourseInfo[] = coursesData as CourseInfo[];

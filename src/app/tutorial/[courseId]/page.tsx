
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import TutorialPageContent from '@/components/tutorial/TutorialPageContent';

export default async function TutorialCoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  // Read fresh data directly from the file system on the server
  const coursesFilePath = path.join(process.cwd(), 'src/data/courses.json');
  const tutorialsFilePath = path.join(process.cwd(), 'src/data/tutorials.json');

  const courses: CourseInfo[] = JSON.parse(fs.readFileSync(coursesFilePath, 'utf-8'));
  const tutorials: Tutorial[] = JSON.parse(fs.readFileSync(tutorialsFilePath, 'utf-8'));
  
  const course = courses.find(c => c.id === courseId);
  const courseChapters = tutorials.filter(t => t.courseId === courseId);

  if (!course) {
    notFound();
  }
  
  return <TutorialPageContent course={course} chapters={courseChapters} />;
}

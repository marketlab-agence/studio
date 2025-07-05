
import { notFound } from 'next/navigation';
import coursesData from '@/data/courses.json';
import tutorialsData from '@/data/tutorials.json';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import TutorialPageContent from '@/components/tutorial/TutorialPageContent';

export default async function TutorialCoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  const allCourses: CourseInfo[] = coursesData;
  const allTutorials: Tutorial[] = tutorialsData;
  
  const course = allCourses.find(c => c.id === courseId);
  const courseChapters = allTutorials.filter(t => t.courseId === courseId);

  if (!course) {
    notFound();
  }
  
  return <TutorialPageContent course={course} chapters={courseChapters} />;
}

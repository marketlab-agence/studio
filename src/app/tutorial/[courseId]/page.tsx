
import { notFound } from 'next/navigation';
import { COURSES } from '@/lib/courses';
import { TUTORIALS } from '@/lib/tutorials';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import TutorialPageContent from '@/components/tutorial/TutorialPageContent';

export default async function TutorialCoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  const allCourses: CourseInfo[] = COURSES;
  const allTutorials: Tutorial[] = TUTORIALS;
  
  const course = allCourses.find(c => c.id === courseId);
  const courseChapters = allTutorials.filter(t => t.courseId === courseId);

  if (!course) {
    notFound();
  }
  
  return <TutorialPageContent course={course} chapters={courseChapters} />;
}

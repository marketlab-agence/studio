
import { notFound } from 'next/navigation';
import { getCourses } from '@/lib/courses';
import { getTutorials } from '@/lib/tutorials';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import TutorialPageContent from '@/components/tutorial/TutorialPageContent';

export default async function TutorialCoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  const allCourses: CourseInfo[] = await getCourses();
  const allTutorials: Tutorial[] = await getTutorials();
  
  const course = allCourses.find(c => c.id === courseId);
  const courseChapters = allTutorials.filter(t => t.courseId === courseId);

  if (!course) {
    notFound();
  }
  
  return <TutorialPageContent course={course} chapters={courseChapters} />;
}

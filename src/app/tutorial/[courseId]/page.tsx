
import { notFound } from 'next/navigation';
import { getCourses } from '@/lib/courses';
import { getTutorials } from '@/lib/tutorials';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import TutorialPageContent from '@/components/tutorial/TutorialPageContent';
import { db } from '@/lib/firebase-admin';

// Helper function to extract number from chapter title
const getChapterNumber = (title: string) => {
  const match = title.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
};

export default async function TutorialCoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  const allCourses: CourseInfo[] = await getCourses(db);
  const allTutorials: Tutorial[] = await getTutorials(db);
  
  const course = allCourses.find(c => c.id === courseId);
  
  // Filter and sort the chapters
  const courseChapters = allTutorials
    .filter(t => t.courseId === courseId)
    .sort((a, b) => getChapterNumber(a.title) - getChapterNumber(b.title));

  if (!course) {
    notFound();
  }
  
  return <TutorialPageContent course={course} chapters={courseChapters} />;
}

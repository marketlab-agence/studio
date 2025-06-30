import { TUTORIALS } from '@/lib/tutorials';
import { notFound } from 'next/navigation';
import { EditLessonForm } from './EditLessonForm';

// This is now a server component
export default async function EditLessonPage({ params }: { params: { courseId: string; chapterId: string; lessonId: string; } }) {
  const { courseId, chapterId, lessonId } = params;

  // Data fetching happens on the server, so it will always be the latest version from the file system
  const chapter = TUTORIALS.find(c => c.id === chapterId);
  const lesson = chapter?.lessons.find(l => l.id === lessonId);

  // If data is not found, render the 404 page before trying to render the client component
  if (!lesson || !chapter) {
    notFound();
  }
  
  // Pass the found data as props to the client component
  return (
    <EditLessonForm 
        initialLesson={lesson} 
        initialChapterTitle={chapter.title}
        courseId={courseId}
        chapterId={chapterId}
    />
  );
}

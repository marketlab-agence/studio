
import { getTutorials } from '@/lib/tutorials';
import { notFound } from 'next/navigation';
import { EditLessonForm } from './EditLessonForm';

type LessonPageProps = {
  params: Promise<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>;
};

export default async function EditLessonPage({ params }: LessonPageProps) {
  const { courseId, chapterId, lessonId } = await params;
  const tutorials = await getTutorials();
  const chapter = tutorials.find(c => c.id === chapterId);
  const lesson = chapter?.lessons.find(l => l.id === lessonId);

  if (!lesson || !chapter) {
    notFound();
  }
  
  return (
    <EditLessonForm 
        initialLesson={lesson} 
        initialChapterTitle={chapter.title}
        courseId={courseId}
        chapterId={chapterId}
    />
  );
}

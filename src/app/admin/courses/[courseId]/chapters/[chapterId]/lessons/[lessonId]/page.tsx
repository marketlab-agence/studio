
import { getTutorials } from '@/lib/tutorials';
import { notFound } from 'next/navigation';
import { EditLessonForm } from './EditLessonForm';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

type LessonPageProps = {
  params: {
    courseId: string;
    chapterId: string;
    lessonId: string;
  };
};

export default async function EditLessonPage({ params }: LessonPageProps) {
  const { courseId, chapterId, lessonId } = params;
  const { db } = await getFirebaseAdmin();
  const tutorials = await getTutorials(db);
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

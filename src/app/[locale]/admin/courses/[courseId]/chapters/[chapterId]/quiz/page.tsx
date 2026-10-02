
import { getTutorials } from '@/lib/tutorials';
import { getQuizzes } from '@/lib/quiz';
import { notFound } from 'next/navigation';
import { EditQuizForm } from './EditQuizForm';

// This is now a server component
export default async function EditQuizPage({ params }: { params: Promise<{ courseId: string; chapterId: string }> }) {
  const { courseId, chapterId } = await params;

  // Data fetching happens on the server
  const tutorials = await getTutorials();
  const chapter = tutorials.find(c => c.id === chapterId);
  const quizzes = await getQuizzes();
  const quiz = quizzes[chapterId] ? JSON.parse(JSON.stringify(quizzes[chapterId])) : null;

  if (!quiz || !chapter) {
    notFound();
  }
  
  return (
    <EditQuizForm
      initialQuiz={quiz}
      initialChapterTitle={chapter.title}
      courseId={courseId}
      chapterId={chapterId}
    />
  );
}

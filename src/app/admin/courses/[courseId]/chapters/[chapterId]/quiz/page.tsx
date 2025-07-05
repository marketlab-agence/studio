
import { TUTORIALS } from '@/lib/tutorials';
import { QUIZZES } from '@/lib/quiz';
import { notFound } from 'next/navigation';
import { EditQuizForm } from './EditQuizForm';

// This is now a server component
export default function EditQuizPage({ params }: { params: { courseId: string; chapterId: string; } }) {
  const { courseId, chapterId } = params;

  // Data fetching happens on the server
  const chapter = TUTORIALS.find(c => c.id === chapterId);
  const quiz = QUIZZES[chapterId] ? JSON.parse(JSON.stringify(QUIZZES[chapterId])) : null;

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

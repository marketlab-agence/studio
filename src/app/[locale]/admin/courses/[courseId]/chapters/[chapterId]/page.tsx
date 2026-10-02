
import { getTutorials } from '@/lib/tutorials';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { FileText, ChevronRight, GraduationCap } from 'lucide-react';
import { getCourses } from '@/lib/courses';

export default async function ChapterLessonsPage({ params }: { params: Promise<{ courseId: string; chapterId: string }> }) {
  const t = await getTranslations('admin');
  const { courseId, chapterId } = await params;
  const tutorials = await getTutorials();
  const chapter = tutorials.find(c => c.id === chapterId);
  const courses = await getCourses();
  const course = courses.find(c => c.id === courseId);

  if (!chapter || !course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/courses" className="hover:text-primary">{t('courses.title')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}`} className="hover:text-primary max-w-xs truncate">{course.title}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground max-w-xs truncate">{chapter.title}</span>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('chapterDetail.lessonsTitle')}</h1>
            <p className="text-muted-foreground">{chapter.title}</p>
          </div>
        </div>
        <Button asChild variant="secondary">
            <Link href={`/admin/courses/${courseId}/chapters/${chapterId}/quiz`}>
                <GraduationCap className="mr-2 h-4 w-4" />
                {t('chapterDetail.editQuiz')}
            </Link>
        </Button>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>{t('chapterDetail.lessonsListTitle')}</CardTitle>
          <CardDescription>{t('chapterDetail.lessonsListDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('chapterDetail.columnLessonTitle')}</TableHead>
                <TableHead>{t('chapterDetail.columnObjective')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapter.lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">{lesson.title}</TableCell>
                    <TableCell className="text-muted-foreground">{lesson.objective}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`}>{t('edit')}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

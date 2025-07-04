
import { TUTORIALS } from '@/lib/tutorials';
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
import Link from 'next/link';
import { FileText, ChevronRight, GraduationCap } from 'lucide-react';
import { COURSES } from '@/lib/courses';

export default function ChapterLessonsPage({ params }: { params: { courseId: string, chapterId: string } }) {
  const chapter = TUTORIALS.find(c => c.id === params.chapterId);
  const course = COURSES.find(c => c.id === params.courseId);

  if (!chapter || !course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/courses" className="hover:text-primary">Formations</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${params.courseId}`} className="hover:text-primary max-w-xs truncate">{course.title}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground max-w-xs truncate">{chapter.title}</span>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leçons du Chapitre</h1>
            <p className="text-muted-foreground">{chapter.title}</p>
          </div>
        </div>
        <Button asChild variant="secondary">
            <Link href={`/admin/courses/${params.courseId}/chapters/${params.chapterId}/quiz`}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Modifier le Quiz
            </Link>
        </Button>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Liste des Leçons</CardTitle>
          <CardDescription>Gérez les leçons de ce chapitre.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre de la Leçon</TableHead>
                <TableHead>Objectif</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapter.lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">{lesson.title}</TableCell>
                    <TableCell className="text-muted-foreground">{lesson.objective}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${params.courseId}/chapters/${params.chapterId}/lessons/${lesson.id}`}>Modifier</Link>
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

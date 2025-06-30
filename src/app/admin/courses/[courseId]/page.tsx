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
import { BookOpen, ChevronRight, UploadCloud } from 'lucide-react';
import { publishCourseAction, getCourseAndChapters } from '@/actions/courseActions';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import { PublishCourseButton } from './PublishCourseButton';


export default async function CourseChaptersPage({ params }: { params: { courseId: string } }) {
  const { course, chapters } = await getCourseAndChapters(params.courseId);

  if (!course) {
    notFound();
  }
  const courseInfo = course as CourseInfo;
  const courseChapters = chapters as Tutorial[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/courses" className="hover:text-primary">Formations</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground max-w-xs truncate">{courseInfo.title}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chapitres de la Formation</h1>
            <p className="text-muted-foreground">{courseInfo.title}</p>
          </div>
        </div>
        {courseInfo.status === 'Brouillon' && (
           <PublishCourseButton courseId={params.courseId} />
        )}
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Liste des Chapitres</CardTitle>
          <CardDescription>Gérez les chapitres de cette formation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre du Chapitre</TableHead>
                <TableHead>Nombre de leçons</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseChapters.filter(Boolean).map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell className="font-medium">{chapter.title}</TableCell>
                    <TableCell>{chapter.lessons.length}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${params.courseId}/chapters/${chapter.id}`}>Modifier</Link>
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


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
import { BookOpen, ChevronRight } from 'lucide-react';

const COURSES_DATA: Record<string, { id: string, title: string, chapters: any[] }> = {
    'git-github-tutorial': {
        id: 'git-github-tutorial',
        title: 'Git & GitHub : Le Guide Complet',
        chapters: TUTORIALS
    }
}

export default function CourseChaptersPage({ params }: { params: { courseId: string } }) {
  const course = COURSES_DATA[params.courseId as keyof typeof COURSES_DATA];

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground">Formation: {course.title}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2 rounded-lg">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chapitres de la Formation</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
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
              {course.chapters.map((chapter) => (
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

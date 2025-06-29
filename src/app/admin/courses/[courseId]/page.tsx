
'use client';

import { notFound, useParams } from 'next/navigation';
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
import { BookOpen, ChevronRight, UploadCloud, Loader2 } from 'lucide-react';
import { publishCourseAction, getCourseAndChapters } from '@/actions/courseActions';
import { useState, useEffect } from 'react';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseChaptersPage() {
  const params = useParams() as { courseId: string };
  
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [courseChapters, setCourseChapters] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    // This effect now fetches data from the server, ensuring it's up-to-date,
    // and polls to handle potential race conditions where the page navigates 
    // before the server-side in-memory data is updated.
    let attempts = 0;
    const intervalId = setInterval(() => {
      async function fetchCourseData() {
        const { course, chapters } = await getCourseAndChapters(params.courseId);
        
        if (course) {
          setCourseInfo(course);
          setCourseChapters(chapters);
          setIsLoading(false);
          clearInterval(intervalId);
        } else {
          attempts++;
          if (attempts > 10) { // Stop trying after ~2 seconds
            setIsLoading(false); // This will allow the component to render and trigger notFound()
            clearInterval(intervalId);
          }
        }
      }
      fetchCourseData();
    }, 200); // Check every 200ms

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [params.courseId]);

  const handlePublish = async () => {
    setIsPublishing(true);
    await publishCourseAction(params.courseId);
    // Update local state for immediate UI feedback
    setCourseInfo(prev => prev ? { ...prev, status: 'Publié' } : null);
    setIsPublishing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-60" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!courseInfo) {
    notFound();
  }

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
            <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Publier la formation
            </Button>
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

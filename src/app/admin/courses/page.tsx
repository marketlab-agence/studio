
'use client';

import { useEffect, useState } from 'react';
import { getAdminCourses } from '@/actions/adminActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, BookCopy, ChevronRight, Loader2 } from 'lucide-react';

type AdminCourse = Awaited<ReturnType<typeof getAdminCourses>>[0] & { status: 'Publié' | 'Brouillon' | 'Plan' };

function ActionButtons({ course }: { course: AdminCourse }) {
    if (course.status === 'Plan') {
        return (
            <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/create-course?planId=${course.id}`}>Modifier le Plan</Link>
                </Button>
                <Button asChild size="sm">
                    <Link href={`/admin/create-course?planId=${course.id}`}>Démarrer la Création</Link>
                </Button>
            </div>
        );
    }
    
    if (course.status === 'Brouillon' || course.status === 'Publié') {
        return (
            <Button asChild variant="outline" size="sm">
                <Link href={`/admin/courses/${course.id}`}>Modifier</Link>
            </Button>
        );
    }

    return null;
}


export default function AdminCoursesListPage() {
  const [allCourses, setAllCourses] = useState<AdminCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
        setIsLoading(true);
        const courses = await getAdminCourses() as AdminCourse[];
        setAllCourses(courses);
        setIsLoading(false);
    }
    fetchCourses();
  }, []);
  
  const badgeVariants: { [key: string]: "default" | "secondary" | "outline" } = {
    'Publié': 'default',
    'Brouillon': 'secondary',
    'Plan': 'outline',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground">Formations</span>
      </div>
        
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <BookCopy className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bibliothèque des formations</h1>
                <p className="text-muted-foreground">Gérez toutes les formations de la plateforme.</p>
            </div>
        </div>
        <Button asChild>
          <Link href="/admin/create-course">
            <PlusCircle className="mr-2 h-4 w-4" /> Créer une Formation
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les formations</CardTitle>
          <CardDescription>
            Liste de toutes les formations publiées, en brouillon ou en plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Nombre de leçons</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
              ) : (
                allCourses.map(course => (
                    <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.lessonsCount}</TableCell>
                    <TableCell><Badge variant={badgeVariants[course.status] || 'secondary'}>{course.status}</Badge></TableCell>
                    <TableCell>
                      <ActionButtons course={course} />
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

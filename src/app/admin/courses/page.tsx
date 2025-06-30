import { getAdminCourses } from '@/actions/adminActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, BookCopy, ChevronRight } from 'lucide-react';
import { ActionButtons } from './ActionButtons';

type AdminCourse = Awaited<ReturnType<typeof getAdminCourses>>[0] & { status: 'Publié' | 'Brouillon' | 'Plan' };

export default async function AdminCoursesListPage() {
  const allCourses = (await getAdminCourses()) as AdminCourse[];
  
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
              {allCourses.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Aucune formation planifiée ou en brouillon.
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

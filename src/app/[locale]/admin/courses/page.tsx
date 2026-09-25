
import { getAdminCoursesAction } from '@/actions/adminActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { PlusCircle, BookCopy, ChevronRight } from 'lucide-react';
import { ActionButtons } from './ActionButtons';

export const dynamic = 'force-dynamic';

type AdminCourse = {
    id: string;
    title: string;
    lessonsCount: number;
    status: 'Publié' | 'Brouillon' | 'Plan';
};

export default async function AdminCoursesListPage() {
  const t = await getTranslations('admin');
  const allCoursesData = await getAdminCoursesAction();
  const allCourses = allCoursesData as AdminCourse[];
  
  const badgeVariants: { [key: string]: "default" | "secondary" | "outline" } = {
    'Publié': 'default',
    'Brouillon': 'secondary',
    'Plan': 'outline',
  };

  const statusLabels: { [key: string]: string } = {
    'Publié': t('courses.statusPublished'),
    'Brouillon': t('courses.statusDraft'),
    'Plan': t('courses.statusPlan'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground">{t('courses.title')}</span>
      </div>
        
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <BookCopy className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('courses.libraryTitle')}</h1>
                <p className="text-muted-foreground">{t('courses.librarySubtitle')}</p>
            </div>
        </div>
        <Button asChild>
          <Link href="/admin/create-course">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('courses.create')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('courses.allTitle')}</CardTitle>
          <CardDescription>
            {t('courses.allDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('courses.columnTitle')}</TableHead>
                <TableHead>{t('courses.columnLessons')}</TableHead>
                <TableHead>{t('courses.columnStatus')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCourses.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        {t('courses.empty')}
                    </TableCell>
                </TableRow>
              ) : (
                allCourses.map(course => (
                    <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.lessonsCount}</TableCell>
                    <TableCell><Badge variant={badgeVariants[course.status] || 'secondary'}>{statusLabels[course.status] || course.status}</Badge></TableCell>
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


'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteCourseButton } from './DeleteCourseButton';
import { useTranslations } from 'next-intl';

type AdminCourse = {
    id: string;
    title: string;
    lessonsCount: number;
    status: 'Publié' | 'Brouillon' | 'Plan';
};

export function ActionButtons({ course }: { course: AdminCourse }) {
    const t = useTranslations('admin');
    const { userRole } = useAuth();
    const isSuperAdmin = userRole === 'Super Admin';

    const editButton = (
        <Button asChild variant="outline" size="sm">
            <Link href={`/admin/courses/${course.id}`}>{t('edit')}</Link>
        </Button>
    );

    const deleteButton = isSuperAdmin ? (
        <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
    ) : null;

    if (course.status === 'Plan') {
        return (
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/create-course?planId=${course.id}`}>{t('courses.editPlan')}</Link>
                </Button>
                {deleteButton}
            </div>
        );
    }
    
    if (course.status === 'Brouillon' || course.status === 'Publié') {
        return (
            <div className="flex items-center gap-4">
                {editButton}
                {deleteButton}
            </div>
        );
    }

    return null;
}

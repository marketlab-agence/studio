'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_USERS } from '@/lib/users';
import { DeleteCourseButton } from './DeleteCourseButton';

type AdminCourse = {
    id: string;
    title: string;
    lessonsCount: number;
    status: 'Publié' | 'Brouillon' | 'Plan';
};

export function ActionButtons({ course }: { course: AdminCourse }) {
    const { user } = useAuth();
    const currentUserData = user ? MOCK_USERS.find(u => u.email === user.email) : null;
    const isSuperAdmin = currentUserData?.role === 'Super Admin';

    const editButton = (
        <Button asChild variant="outline" size="sm">
            <Link href={`/admin/courses/${course.id}`}>Modifier</Link>
        </Button>
    );

    const deleteButton = isSuperAdmin ? (
        <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
    ) : null;

    if (course.status === 'Plan') {
        return (
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/create-course?planId=${course.id}`}>Modifier le Plan</Link>
                </Button>
                <Button asChild size="sm">
                    <Link href={`/admin/create-course?planId=${course.id}`}>Démarrer la Création</Link>
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

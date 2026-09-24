'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { deleteCourseAction } from '@/actions/courseActions';
import { useTranslations } from 'next-intl';

interface DeleteCourseButtonProps {
    courseId: string;
    courseTitle: string;
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const t = useTranslations('admin');
    const tc = useTranslations('common');
    
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteCourseAction(courseId);
            toast({
                title: t('deleteCourse.successTitle'),
                description: t('deleteCourse.successDescription', { title: courseTitle }),
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({
                title: tc('errorTitle'),
                description: t('deleteCourse.errorDescription'),
                variant: 'destructive',
            });
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('deleteCourse.trigger')}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteCourse.confirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('deleteCourse.confirmDescription', { title: courseTitle })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('deleteCourse.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

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

interface DeleteCourseButtonProps {
    courseId: string;
    courseTitle: string;
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteCourseAction(courseId);
            toast({
                title: 'Formation supprimée',
                description: `La formation "${courseTitle}" a été supprimée avec succès.`,
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erreur',
                description: 'La suppression de la formation a échoué.',
                variant: 'destructive',
            });
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" aria-label="Supprimer la formation">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Elle supprimera définitivement la formation "{courseTitle}" ainsi que tous ses chapitres, leçons et quiz associés.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer la suppression
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

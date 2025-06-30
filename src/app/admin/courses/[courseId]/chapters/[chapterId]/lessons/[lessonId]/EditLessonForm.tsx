
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Save, Pencil, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Lesson } from '@/types/tutorial.types';
import { updateLessonContent } from '@/actions/courseActions';

export function EditLessonForm({ initialLesson, initialChapterTitle, courseId, chapterId }: { initialLesson: Lesson; initialChapterTitle: string, courseId: string, chapterId: string }) {
  const { toast } = useToast();
  
  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateLessonContent(courseId, chapterId, lesson);
        toast({
            title: 'Leçon Sauvegardée',
            description: `La leçon "${lesson.title}" a été mise à jour avec succès.`,
        });
    } catch (error) {
        console.error(error);
        toast({
            title: 'Erreur',
            description: "La sauvegarde de la leçon a échoué.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}`} className="hover:text-primary">Formation</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}/chapters/${chapterId}`} className="hover:text-primary_foreground truncate max-w-xs">{initialChapterTitle}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground truncate max-w-xs">{lesson.title}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <Pencil className="h-8 w-8 text-primary" />
            </div>
            <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Modifier la Leçon</h1>
            <p className="text-muted-foreground">Chapitre: {initialChapterTitle}</p>
            </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
           <div className="space-y-2">
                <Label htmlFor="lessonTitle">Titre de la leçon</Label>
                <Input 
                    id="lessonTitle" 
                    value={lesson.title} 
                    onChange={(e) => setLesson(prev => ({...prev, title: e.target.value}))}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="lessonObjective">Objectif</Label>
                <Input 
                    id="lessonObjective" 
                    value={lesson.objective} 
                    onChange={(e) => setLesson(prev => ({...prev, objective: e.target.value}))}
                />
            </div>
          <div className="space-y-2">
            <Label htmlFor="lessonContent">Contenu de la leçon (Markdown)</Label>
            <Textarea
              id="lessonContent"
              value={lesson.content}
              onChange={(e) => setLesson(prev => ({...prev, content: e.target.value}))}
              className="min-h-[400px] font-code"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

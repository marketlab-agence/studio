'use client';

import { useState, useEffect } from 'react';
import { TUTORIALS } from '@/lib/tutorials';
import { notFound, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Save, Pencil, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Lesson } from '@/types/tutorial.types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditLessonPage() {
  const params = useParams();
  const { courseId, chapterId, lessonId } = params as { courseId: string; chapterId: string; lessonId: string; };
  const { toast } = useToast();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const chapter = TUTORIALS.find(c => c.id === chapterId);
    const lessonData = chapter?.lessons.find(l => l.id === lessonId);
    
    if (lessonData && chapter) {
      setLesson(lessonData);
      setChapterTitle(chapter.title);
    }
    setIsLoading(false);
  }, [chapterId, lessonId]);

  const handleSave = () => {
    setIsSaving(true);
    // In a real app, you'd call an API here to save the changes.
    // For now, we just simulate it and show a toast.
    console.log('Saving lesson:', lesson);
    setTimeout(() => {
        toast({
            title: 'Leçon Sauvegardée',
            description: `La leçon "${lesson?.title}" a été mise à jour (simulation).`,
        });
        setIsSaving(false);
    }, 1000);
  };
  
  if (isLoading) {
      return (
        <div className="space-y-6">
            <Skeleton className="h-6 w-1/2" />
            <div className="flex justify-between items-center">
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
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
      );
  }

  if (!lesson) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}`} className="hover:text-primary">Formation</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}/chapters/${chapterId}`} className="hover:text-primary_foreground truncate max-w-xs">{chapterTitle}</Link>
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
            <p className="text-muted-foreground">Chapitre: {chapterTitle}</p>
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
                    onChange={(e) => setLesson(prev => prev ? {...prev, title: e.target.value} : null)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="lessonObjective">Objectif</Label>
                <Input 
                    id="lessonObjective" 
                    value={lesson.objective} 
                    onChange={(e) => setLesson(prev => prev ? {...prev, objective: e.target.value} : null)}
                />
            </div>
          <div className="space-y-2">
            <Label htmlFor="lessonContent">Contenu de la leçon (Markdown)</Label>
            <Textarea
              id="lessonContent"
              value={lesson.content}
              onChange={(e) => setLesson(prev => prev ? {...prev, content: e.target.value} : null)}
              className="min-h-[400px] font-code"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Save, Pencil, Loader2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Lesson } from '@/types/tutorial.types';
import { 
    updateLessonContent, 
    generateAndSaveLessonMarkdown,
    suggestAndSaveLessonComponents
} from '@/actions/courseActions';

export function EditLessonForm({ initialLesson, initialChapterTitle, courseId, chapterId }: { initialLesson: Lesson; initialChapterTitle: string, courseId: string, chapterId: string }) {
  const { toast } = useToast();
  
  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingComponents, setIsGeneratingComponents] = useState(false);

  const getIndices = () => {
    const chapterIndexMatch = chapterId.match(/-ch(\d+)$/);
    const lessonIndexMatch = lesson.id.match(/-l(\d+)$/);

    if (!chapterIndexMatch || !lessonIndexMatch) {
        toast({ title: 'Erreur de format d\'ID', description: 'Impossible de déterminer les indices du chapitre/leçon.', variant: 'destructive'});
        return null;
    }
    
    const chapterIndex = parseInt(chapterIndexMatch[1], 10) - 1;
    const lessonIndex = parseInt(lessonIndexMatch[1], 10) - 1;
    return { chapterIndex, lessonIndex };
  }

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

  const handleGenerateContent = async () => {
    const indices = getIndices();
    if (!indices) return;
    
    setIsGeneratingContent(true);
    try {
      const { illustrativeContent } = await generateAndSaveLessonMarkdown(courseId, indices.chapterIndex, indices.lessonIndex);
      setLesson(prev => ({ ...prev, content: illustrativeContent }));
      toast({ title: 'Contenu régénéré !', description: 'Le contenu Markdown a été mis à jour par lIA.' });
    } catch (error) {
        console.error(error);
        toast({
            title: 'Erreur de Génération',
            description: 'Impossible de générer le contenu.',
            variant: 'destructive',
        });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSuggestComponents = async () => {
    const indices = getIndices();
    if (!indices) return;

    setIsGeneratingComponents(true);
    try {
        const { interactiveComponentName, visualComponentName } = await suggestAndSaveLessonComponents(courseId, indices.chapterIndex, indices.lessonIndex);
        
        setLesson(prev => ({
            ...prev,
            interactiveComponentName,
            visualComponentName
        }));

        toast({
            title: 'Composants suggérés !',
            description: 'Les composants pédagogiques ont été mis à jour par l\'IA.',
        });
    } catch (error) {
        console.error(error);
        toast({
            title: 'Erreur de Suggestion',
            description: 'Impossible de suggérer des composants.',
            variant: 'destructive',
        });
    } finally {
        setIsGeneratingComponents(false);
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
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Contenu de la Leçon</CardTitle>
                <Button variant="outline" onClick={handleGenerateContent} disabled={isGeneratingContent}>
                    {isGeneratingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Régénérer le contenu
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
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

      <Card>
        <CardHeader>
            <CardTitle>Composants Pédagogiques</CardTitle>
            <CardDescription>
                L'IA peut suggérer des composants pertinents. Vous pouvez aussi les renseigner manuellement.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="interactiveComponent">Composant Interactif / Pratique</Label>
                    <Input
                        id="interactiveComponent"
                        value={lesson.interactiveComponentName || ''}
                        onChange={(e) => setLesson(prev => ({...prev, interactiveComponentName: e.target.value}))}
                        placeholder="Ex: StagingAreaVisualizer"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="visualComponent">Composant de Visualisation</Label>
                    <Input
                        id="visualComponent"
                        value={lesson.visualComponentName || ''}
                        onChange={(e) => setLesson(prev => ({...prev, visualComponentName: e.target.value}))}
                        placeholder="Ex: GitGraph"
                    />
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="outline" onClick={handleSuggestComponents} disabled={isGeneratingComponents}>
                {isGeneratingComponents ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Suggérer des composants
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

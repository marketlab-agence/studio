
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Save, Pencil, Loader2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Lesson } from '@/types/tutorial.types';
import { 
    updateLessonContentAction, 
    generateLessonContentAction,
} from '@/actions/courseActions';

interface EditLessonFormProps {
    initialLesson: Lesson;
    initialChapterTitle: string;
    courseId: string;
    chapterId: string;
}

export function EditLessonForm({ 
    initialLesson, 
    initialChapterTitle, 
    courseId, 
    chapterId,
}: EditLessonFormProps) {
  const { toast } = useToast();
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  
  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Met à jour le composant à une position donnée, ou le retire si le nom est vide.
   *
   * ⚠️ **Les positions sont renumérotées après chaque modification.** Laisser un
   * trou (position 0 puis 2) ferait échouer la contrainte d'unicité dès la
   * prochaine insertion au même endroit — et l'ordre d'affichage dépend d'une
   * suite continue.
   */
  const majComposant = (position: number, nom: string) => {
    setLesson((prev) => {
      const composants = [...(prev.components ?? [])];

      if (!nom.trim()) {
        composants.splice(position, 1);
      } else if (composants[position]) {
        composants[position] = { ...composants[position], name: nom };
      } else {
        composants[position] = { name: nom, position, config: {} };
      }

      return { ...prev, components: composants.map((c, i) => ({ ...c, position: i })) };
    });
  };

  const getIndices = () => {
    const chapterIndexMatch = chapterId.match(/-ch(\d+)$/);
    const lessonIndexMatch = lesson.id.match(/-l(\d+)$/);

    if (!chapterIndexMatch || !lessonIndexMatch) {
        toast({ title: t('editLesson.invalidIdTitle'), description: t('editLesson.invalidIdDescription'), variant: 'destructive'});
        return null;
    }
    
    const chapterIndex = parseInt(chapterIndexMatch[1], 10) - 1;
    const lessonIndex = parseInt(lessonIndexMatch[1], 10) - 1;
    return { chapterIndex, lessonIndex };
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateLessonContentAction(courseId, chapterId, lesson);
        toast({
            title: t('editLesson.savedTitle'),
            description: t('editLesson.savedDescription', { title: lesson.title }),
        });
    } catch (error) {
        console.error(error);
        toast({
            title: tc('errorTitle'),
            description: t('editLesson.saveErrorDescription'),
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleGenerateContent = async () => {
    const indices = getIndices();
    if (!indices) return;
    
    setIsGenerating(true);
    try {
      const { illustrativeContent, components } = await generateLessonContentAction(courseId, indices.chapterIndex, indices.lessonIndex);
      
      setLesson(prev => ({ 
          ...prev, 
          content: illustrativeContent,
          // L'ordre renvoyé par l'IA devient l'ordre des positions persistées.
          components: components.map((composant, index) => ({
              name: composant.name,
              position: index,
              config: composant.config ?? {},
          })),
      }));
      
      toast({ title: t('editLesson.generatedTitle'), description: t('editLesson.generatedDescription') });
    } catch (error) {
        console.error(error);
        toast({
            title: t('editLesson.generateErrorTitle'),
            description: t('editLesson.generateErrorDescription'),
            variant: 'destructive',
        });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}`} className="hover:text-primary">{t('editLesson.breadcrumbCourse')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}/chapters/${chapterId}`} className="hover:text-primary max-w-xs truncate">{initialChapterTitle}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground truncate max-w-xs">{lesson.title}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <Pencil className="h-8 w-8 text-primary" />
            </div>
            <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('editLesson.title')}</h1>
            <p className="text-muted-foreground">{t('editLesson.chapterLabel', { title: initialChapterTitle })}</p>
            </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('editLesson.save')}
        </Button>
      </div>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>{t('editLesson.contentTitle')}</CardTitle>
                <Button variant="outline" onClick={handleGenerateContent} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {t('editLesson.generate')}
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
                <Label htmlFor="lessonTitle">{t('editLesson.lessonTitle')}</Label>
                <Input 
                    id="lessonTitle" 
                    value={lesson.title} 
                    onChange={(e) => setLesson(prev => ({...prev, title: e.target.value}))}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="lessonObjective">{t('editLesson.objective')}</Label>
                <Input 
                    id="lessonObjective" 
                    value={lesson.objective} 
                    onChange={(e) => setLesson(prev => ({...prev, objective: e.target.value}))}
                />
            </div>
          <div className="space-y-2">
            <Label htmlFor="lessonContent">{t('editLesson.contentLabel')}</Label>
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
            <CardTitle>{t('editLesson.componentsTitle')}</CardTitle>
            <CardDescription>
                {t('editLesson.componentsDescription')}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="interactiveComponent">{t('editLesson.interactiveComponent')}</Label>
                    <Input
                        id="interactiveComponent"
                        value={lesson.components?.[0]?.name ?? ''}
                        onChange={(e) => majComposant(0, e.target.value)}
                        placeholder={t('editLesson.interactiveComponentPlaceholder')}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="visualComponent">{t('editLesson.visualComponent')}</Label>
                    <Input
                        id="visualComponent"
                        value={lesson.components?.[1]?.name ?? ''}
                        onChange={(e) => majComposant(1, e.target.value)}
                        placeholder={t('editLesson.visualComponentPlaceholder')}
                    />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

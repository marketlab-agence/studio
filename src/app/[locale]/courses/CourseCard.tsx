
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCommitHorizontal, KanbanSquare, Sparkles, Rocket, BrainCircuit, ArrowRight, Handshake } from 'lucide-react';
import type { CourseInfo } from '@/types/course.types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type CourseCardProps = {
    course: CourseInfo;
    chapterCount: number;
    lessonCount: number;
};

const courseIcons: Record<string, React.ElementType> = {
  'git-github-tutorial': GitCommitHorizontal,
  'le-closing-pour-debutants-de-prospect-a-client': Handshake,
  'introduction-au-marketing-digital': Sparkles,
  'ingenierie-des-prompts-pour-debutants': BrainCircuit,
  'jira-de-zero-a-heros': KanbanSquare,
  'automatisation-de-processus-informatique-pour-debutants-avec-n8n': Rocket,
};


export function CourseCard({ course, chapterCount, lessonCount }: CourseCardProps) {
    const { user, isPremium, accessibleCourses } = useAuth();
    const router = useRouter();
    const t = useTranslations('catalog');

    const Icon = courseIcons[course.id] || Rocket;
    const href = `/tutorial/${course.id}`;
    
    const hasAccess = isPremium || (accessibleCourses && accessibleCourses.includes(course.id));
    
    const handleButtonClick = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (hasAccess) {
            router.push(href);
        } else {
            router.push('/pricing');
        }
    };
    
    const buttonText = !user ? 'Se connecter pour commencer' : (hasAccess ? 'Commencer la formation' : 'Passer au Premium');

    return (
        <Card key={course.id} className="flex flex-col h-full shadow-lg border-primary/20">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                    <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                    <CardTitle className="text-2xl">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                    Cette formation est conçue pour vous apporter des compétences pratiques et directement applicables dans votre quotidien professionnel.
                </p>
            </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                  <div className="flex flex-wrap gap-2">
                      <Badge>Inclus</Badge>
                      {/*
                        ⚠️ **Le marquage de langue est la partie non négociable de
                        l'option C.** L'interface peut être en anglais alors que la
                        formation est en français : sans ce badge, un apprenant
                        anglophone ne le découvrirait qu'après avoir commencé.
                      */}
                      <Badge variant="outline">
                          {course.language === 'en' ? t('languageEn') : t('languageFr')}
                      </Badge>
                      {chapterCount > 0 && <Badge variant="secondary">{chapterCount} Chapitres</Badge>}
                      {lessonCount > 0 && <Badge variant="secondary">{lessonCount} Leçons</Badge>}
                      <Badge variant="secondary">Quiz Interactifs</Badge>
                  </div>
                <Button className="w-full" size="lg" onClick={handleButtonClick}>
                    {buttonText} <ArrowRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
}


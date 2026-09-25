
'use client';

import { AiHelper } from '@/components/interactive/AiHelper';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useRequirePremium } from '@/hooks/useRequirePremium';
import { useTutorial } from '@/contexts/TutorialContext';
import { useTranslations } from 'next-intl';

export default function AiAssistantPage() {
  const t = useTranslations('assistant');
  const { user, loading } = useAuth();
  const router = useRouter();
  const { course } = useTutorial();
  
  // This hook will redirect non-premium users.
  useRequirePremium();

  // This effect handles non-logged-in users.
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const assistantContext = useMemo(() => {
    if (course) {
        return {
            topic: course.title,
            description: t('withCourseDescription', { title: course.title }),
            pageTitle: t('withCoursePageTitle', { title: course.title })
        };
    }
    return {
        topic: t('defaultTopic'),
        description: t('defaultDescription'),
        pageTitle: t('defaultPageTitle')
    };
  }, [course, t]);


  if (loading || !user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </main>
    );
  }

  // A premium user will see this content.
  // A non-premium user will see the loading screen briefly before being redirected.
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{assistantContext.pageTitle}</h1>
            <p className="text-muted-foreground">{assistantContext.description}</p>
          </div>
        </div>
        
        {course && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
                <BookOpen className="h-5 w-5 text-muted-foreground"/>
                <p className="text-sm text-muted-foreground">
                    {t.rich('contextualizedOn', {
                        title: course.title,
                        span: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
                    })}
                </p>
            </div>
        )}

        <AiHelper 
          courseTopic={assistantContext.topic} 
          lessonContext={t('lessonContext')} 
        />

      </div>
    </main>
  );
}


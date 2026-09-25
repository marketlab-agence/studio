
'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCommitHorizontal, KanbanSquare, Users, MessageSquare, BookMarked, Database, ArrowRight, Handshake, Sparkles, Rocket, BrainCircuit, Loader2 } from 'lucide-react';
import type { CourseInfo } from '@/types/course.types';
import type { Tutorial } from '@/types/tutorial.types';
import { CourseCard } from './CourseCard';


// We can't use generateMetadata in a client component, but we can set the title.
// export const metadata: Metadata = {
//   title: 'Formations - Katalyst',
//   description: 'Découvrez toutes nos formations interactives pour maîtriser Git, Jira, AWS, Trello, et plus encore.',
// };

export default function CoursesPage() {
    const t = useTranslations('catalog');

    // Les formations à venir sont une liste de données : leurs libellés sont
    // traduits ici, avec des clés statiques, plutôt que reconstruits dynamiquement.
    const futureCourses = [
      {
        title: t('futureTrelloTitle'),
        icon: Users,
        description: t('futureTrelloDescription'),
      },
      {
        title: t('futureSlackTitle'),
        icon: MessageSquare,
        description: t('futureSlackDescription'),
      },
      {
        title: t('futureNotionTitle'),
        icon: BookMarked,
        description: t('futureNotionDescription'),
      },
      {
        title: t('futureAwsTitle'),
        icon: Database,
        description: t('futureAwsDescription'),
      },
      {
        title: t('futureDockerTitle'),
        icon: GitCommitHorizontal, // placeholder
        description: t('futureDockerDescription'),
      }
    ];

    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    /**
     * Filtre de langue — option C : le catalogue affiche TOUT, mais l'apprenant
     * peut restreindre la liste. `'all'` rend l'intégralité.
     */
    const [langueFiltree, setLangueFiltree] = useState<'all' | 'fr' | 'en'>('all');

    useEffect(() => {
        document.title = t('documentTitle');
        async function fetchData() {
            setIsLoading(true);
            try {
                const [coursesRes, tutorialsRes] = await Promise.all([
                    fetch('/api/courses'),
                    fetch('/api/tutorials')
                ]);
                if (coursesRes.ok) {
                    const allCourses: CourseInfo[] = await coursesRes.json();
                    setCourses(allCourses.filter(c => c.status === 'Publié'));
                }
                if (tutorialsRes.ok) setTutorials(await tutorialsRes.json());
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [t]);

    /**
     * ⚠️ **Filtrage côté client, volontairement.** Le catalogue compte 6 formations :
     * un aller-retour serveur à chaque changement de filtre serait plus lent que le
     * filtrage en mémoire, et ferait clignoter la liste.
     */
    const coursesAffichees =
        langueFiltree === 'all' ? courses : courses.filter((c) => c.language === langueFiltree);

    return (
      <main className="flex-1 bg-background">
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t('title')}</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            {/* Filtre de langue — masqué pendant le chargement pour ne pas offrir
                un contrôle qui ne filtrerait rien. */}
            {!isLoading && courses.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-8">
                <label htmlFor="filtre-langue" className="text-sm text-muted-foreground">
                  {t('filterByLanguage')}
                </label>
                <select
                  id="filtre-langue"
                  value={langueFiltree}
                  onChange={(e) => setLangueFiltree(e.target.value as 'all' | 'fr' | 'en')}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">{t('allLanguages')}</option>
                  <option value="fr">{t('languageFr')}</option>
                  <option value="en">{t('languageEn')}</option>
                </select>
              </div>
            )}

            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 md:grid-cols-1 lg:grid-cols-1">
               {isLoading ? (
                  <div className="flex justify-center items-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
              ) : coursesAffichees.length === 0 && courses.length > 0 ? (
                  <p className="text-center text-muted-foreground">{t('noResultForFilter')}</p>
              ) : (
                  coursesAffichees.map((course) => {
                      const chapterCount = tutorials.filter(t => t.courseId === course.id).length;
                      const lessonCount = tutorials.filter(t => t.courseId === course.id).reduce((acc, t) => acc + t.lessons.length, 0);

                      return (
                          <CourseCard 
                              key={course.id}
                              course={course}
                              chapterCount={chapterCount}
                              lessonCount={lessonCount}
                          />
                      )
                  })
              )}
            </div>

            <div className="mt-16">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t('comingSoonTitle')}</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      {t('comingSoonSubtitle')}
                  </p>
                  </div>
              </div>
              <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 lg:grid-cols-3">
                  {futureCourses.map((course, index) => (
                      <Card key={index} className="flex flex-col border-dashed h-full">
                          <CardHeader>
                              <div className="p-3 bg-muted rounded-full w-fit">
                                  <course.icon className="h-6 w-6 text-muted-foreground" />
                              </div>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              <CardTitle className="text-lg">{course.title}</CardTitle>
                              <CardDescription className="mt-2">{course.description}</CardDescription>
                          </CardContent>
                          <CardFooter>
                              <Badge variant="outline">{t('comingSoonBadge')}</Badge>
                          </CardFooter>
                      </Card>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

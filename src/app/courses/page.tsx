
'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
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

const futureCourses = [
  {
    title: 'Trello : La Simplicité Visuelle',
    icon: Users,
    description: "Maîtrisez l'art des tableaux Kanban pour une gestion de projet intuitive et collaborative.",
  },
  {
    title: 'Slack : Communication & Automatisation',
    icon: MessageSquare,
    description: 'Transformez votre manière de communiquer et intégrez des workflows automatisés.',
  },
  {
    title: 'Notion : Votre Second Cerveau',
    icon: BookMarked,
    description: "Structurez la connaissance, gérez les tâches et construisez des systèmes d'organisation personnels et d'équipe.",
  },
  {
    title: 'AWS : Les Fondamentaux du Cloud',
    icon: Database,
    description: 'Comprenez les services cloud essentiels et apprenez à déployer des applications sur AWS.',
  },
  {
    title: 'Docker : Le Guide Pratique',
    icon: GitCommitHorizontal, // placeholder
    description: 'Apprenez à créer, gérer et déployer des applications conteneurisées pour des déploiements cohérents.',
  }
];

export default function CoursesPage() {
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = 'Formations - Katalyst';
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
    }, []);

  return (
    <main className="flex-1 bg-background">
      <section className="w-full py-12 md:py-20 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nos Formations Interactives</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Apprenez en faisant. Chaque cours est une simulation conçue pour vous rendre opérationnel.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 md:grid-cols-1 lg:grid-cols-1">
             {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                courses.map((course) => {
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Formations à Venir</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Notre catalogue s'agrandit constamment. Voici un aperçu de ce qui vous attend.
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
                            <Badge variant="outline">Bientôt disponible</Badge>
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

import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCommitHorizontal, KanbanSquare, Users, MessageSquare, BookMarked, Database, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Formations - Git Explorer',
  description: 'Découvrez toutes nos formations interactives pour maîtriser Git, Jira, AWS, Trello, et plus encore.',
};

const mainCourse = {
  title: 'Git & GitHub : Le Guide Complet',
  description: 'La compétence fondamentale pour tout développeur. De la première ligne de commande à la contribution open source.',
  icon: GitCommitHorizontal,
  tags: ['Inclus', '11 Chapitres', 'Quiz Interactifs'],
  features: [
    'Apprenez les commandes fondamentales et avancées de Git.',
    'Maîtrisez les workflows professionnels comme GitFlow.',
    'Collaborez efficacement sur GitHub avec les Pull Requests et les Issues.',
    'Entraînez-vous avec plus de 20 simulateurs et composants interactifs.',
  ],
  href: '/tutorial'
};

const futureCourses = [
  {
    title: 'Jira : De Zéro à Héros',
    icon: KanbanSquare,
    description: 'Organisez, suivez et gérez le travail de votre équipe avec le leader de la gestion de projet Agile.',
  },
  {
    title: 'Trello : La Simplicité Visuelle',
    icon: Users,
    description: 'Maîtrisez l\'art des tableaux Kanban pour une gestion de projet intuitive et collaborative.',
  },
  {
    title: 'Slack : Communication & Automatisation',
    icon: MessageSquare,
    description: 'Transformez votre manière de communiquer et intégrez des workflows automatisés.',
  },
  {
    title: 'Notion : Votre Second Cerveau',
    icon: BookMarked,
    description: 'Structurez la connaissance, gérez les tâches et construisez des systèmes d\'organisation personnels et d\'équipe.',
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
            <Card className="flex flex-col h-full shadow-lg border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <mainCourse.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{mainCourse.title}</CardTitle>
                    <CardDescription>{mainCourse.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {mainCourse.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                 <div className="flex flex-wrap gap-2">
                    {mainCourse.tags.map((tag, index) => (
                        <Badge key={index} variant={index === 0 ? 'default' : 'secondary'}>{tag}</Badge>
                    ))}
                </div>
                <Link href={mainCourse.href} className="w-full">
                  <Button className="w-full" size="lg">
                    Commencer la formation <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
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

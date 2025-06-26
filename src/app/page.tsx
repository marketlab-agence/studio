import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BrainCircuit, CheckCircle, Code, GitCommitHorizontal, Layers, MousePointerClick, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 bg-background">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-24 lg:py-32 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Maîtrisez Git & GitHub de Manière <span className="text-primary">Interactive</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Passez de débutant à expert grâce à des simulateurs, des quiz et des visualisations animées. Apprenez en pratiquant, pas seulement en lisant.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/tutorial">
                  <Button size="lg">
                    Commencer l'apprentissage
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    Mon Tableau de Bord
                  </Button>
                </Link>
              </div>
            </div>
            <img
              src="https://placehold.co/600x400.png"
              data-ai-hint="abstract code"
              width="600"
              height="400"
              alt="Hero"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Notre Approche</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Apprendre en Faisant, Pas en Regardant</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Oubliez les tutoriels vidéo passifs. Notre plateforme vous plonge dans des scénarios réels avec des outils interactifs qui réagissent à vos actions.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="grid gap-1 text-center">
              <MousePointerClick className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Apprentissage Pratique</h3>
              <p className="text-muted-foreground">Utilisez nos simulateurs pour manipuler des branches, résoudre des conflits et exécuter des commandes Git sans risque.</p>
            </div>
            <div className="grid gap-1 text-center">
                <BrainCircuit className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Visualisations Claires</h3>
              <p className="text-muted-foreground">Comprenez les concepts complexes comme le flux de données Git grâce à des diagrammes et animations simples.</p>
            </div>
            <div className="grid gap-1 text-center">
                <CheckCircle className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Validation des Acquis</h3>
              <p className="text-muted-foreground">Testez vos connaissances avec des quiz à la fin de chaque chapitre et obtenez une certification basée sur vos performances.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nos Formations Interactives</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Commencez par notre formation complète sur Git & GitHub, et restez à l'affût des nouveautés.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 md:grid-cols-2 lg:grid-cols-2">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <GitCommitHorizontal className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Git & GitHub : Le Guide Complet</CardTitle>
                    <CardDescription>De la première ligne de commande à la contribution open source.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Apprenez les commandes fondamentales et avancées de Git.</li>
                    <li>Maîtrisez les workflows professionnels comme GitFlow.</li>
                    <li>Collaborez efficacement sur GitHub avec les Pull Requests et les Issues.</li>
                    <li>Entraînez-vous avec plus de 20 simulateurs et composants interactifs.</li>
                </ul>
              </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                 <div className="flex flex-wrap gap-2">
                    <Badge>Débutant à Avancé</Badge>
                    <Badge variant="secondary">11 Chapitres</Badge>
                    <Badge variant="secondary">Quiz Interactifs</Badge>
                </div>
                <Link href="/tutorial" className="w-full">
                  <Button className="w-full">Commencer la formation</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col h-full border-dashed">
              <CardHeader>
                 <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-full">
                    <Rocket className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>Formations à Venir</CardTitle>
                    <CardDescription>Notre catalogue s'agrandit !</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                 <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Layers className="h-4 w-4"/> Docker & Conteneurs : Le Guide Pratique</li>
                    <li className="flex items-center gap-2"><Code className="h-4 w-4"/> Principes de la Programmation (Python)</li>
                    <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4"/> CI/CD avec GitHub Actions (Avancé)</li>
                 </ul>
              </CardContent>
              <CardFooter>
                  <p className="text-xs text-muted-foreground">Revenez bientôt pour découvrir de nouvelles formations interactives.</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

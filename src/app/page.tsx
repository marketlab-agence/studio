import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BrainCircuit, CheckCircle, Database, GitCommitHorizontal, KanbanSquare, Layers, MessageSquare, MousePointerClick, Rocket, Users, BookMarked } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const tools = [
  { name: 'Jira', icon: KanbanSquare },
  { name: 'Trello', icon: Users },
  { name: 'Slack', icon: MessageSquare },
  { name: 'Notion', icon: BookMarked },
  { name: 'AWS', icon: Database },
];

export default function Home() {
  return (
    <main className="flex-1 bg-background">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-24 lg:py-32 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-4">
                 <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  La maîtrise des outils professionnels.
                  <span className="block text-primary">Réinventée.</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  De Jira à AWS, apprenez en faisant. Nos simulations interactives vous plongent dans des scénarios réels pour une compétence qui dure vraiment.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/courses">
                  <Button size="lg">
                    Explorer les formations
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
            <Image
              src="https://placehold.co/600x400.png"
              width={600}
              height={400}
              alt="Hero"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              data-ai-hint="productivity workflow tools"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Notre différence</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">La compétence par la pratique.</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Les tutoriels vidéo, c'est bien. La mémoire musculaire, c'est mieux. Notre approche unique vous fait manipuler les outils comme si vous étiez déjà en poste.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="grid gap-1 text-center">
              <MousePointerClick className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Simulations Réalistes</h3>
              <p className="text-muted-foreground">Créez un ticket Jira, configurez une alerte Slack, lancez une instance AWS. Le tout, dans un environnement guidé et sans risque.</p>
            </div>
            <div className="grid gap-1 text-center">
                <BrainCircuit className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Apprentissage Contextuel</h3>
              <p className="text-muted-foreground">Comprenez le *pourquoi* derrière chaque clic. Nos visualisations et explications claires transforment les concepts abstraits en savoir concret.</p>
            </div>
            <div className="grid gap-1 text-center">
                <CheckCircle className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Validation des Compétences</h3>
              <p className="text-muted-foreground">Prouvez votre expertise avec des quiz et des projets finaux qui valident que vous savez non seulement quoi faire, mais aussi comment le faire.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Un écosystème d'apprentissage complet.</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nous couvrons les outils essentiels que les entreprises s'arrachent. Commencez par un cours, maîtrisez-les tous.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 md:grid-cols-1 lg:grid-cols-1">
            <Card className="flex flex-col h-full shadow-lg border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <GitCommitHorizontal className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Git & GitHub : Le Guide Complet</CardTitle>
                    <CardDescription>La compétence fondamentale pour tout développeur. De la première ligne de commande à la contribution open source.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Apprenez les commandes fondamentales et avancées de Git.</li>
                    <li>Maîtrisez les workflows professionnels comme GitFlow.</li>
                    <li>Collaborez efficacement sur GitHub avec les Pull Requests et les Issues.</li>
                </ul>
              </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                 <div className="flex flex-wrap gap-2">
                    <Badge>Inclus</Badge>
                    <Badge variant="secondary">11 Chapitres</Badge>
                    <Badge variant="secondary">Quiz Interactifs</Badge>
                </div>
                <Link href="/tutorial" className="w-full">
                  <Button className="w-full" size="lg">Commencer la formation</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 md:grid-cols-3 lg:grid-cols-5">
             {tools.map(tool => (
                <Card key={tool.name} className="flex flex-col items-center justify-center text-center p-4 border-dashed h-full">
                  <div className="p-3 bg-muted rounded-full w-fit mb-2">
                    <tool.icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <Badge variant="outline" className="mt-auto">Bientôt disponible</Badge>
                </Card>
             ))}
          </div>
        </div>
      </section>
    </main>
  );
}

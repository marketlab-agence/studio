import { Metadata } from 'next';
import { Terminal, MousePointerClick, BrainCircuit, Bot, AreaChart, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Fonctionnalités - Git Explorer',
  description: 'Découvrez les outils interactifs qui font de Git Explorer la meilleure plateforme pour maîtriser les outils professionnels.',
};

const features = [
  {
    icon: MousePointerClick,
    title: 'Simulations Interactives',
    description: "Plongez dans des leçons qui intègrent des simulateurs pour une pratique immédiate. Apprenez en faisant, pas seulement en lisant.",
  },
  {
    icon: Terminal,
    title: 'Environnements Sans Risque',
    description: "Utilisez des interfaces et terminaux intégrés pour manipuler les outils dans un environnement sécurisé, sans craindre de casser quoi que ce soit.",
  },
  {
    icon: BrainCircuit,
    title: 'Visualisations Claires',
    description: "Comprenez les concepts complexes comme les workflows Jira, les architectures AWS ou les flux de données grâce à des diagrammes animés et interactifs.",
  },
  {
    icon: Bot,
    title: 'Aide Contextuelle IA',
    description: "Coincé sur une tâche ? Notre IA vous fournit des explications et des indices basés sur votre état actuel dans le simulateur.",
  },
  {
    icon: AreaChart,
    title: 'Suivi de Compétences',
    description: "Visualisez votre progression, vos scores aux quiz et votre maîtrise des fonctionnalités sur un tableau de bord personnalisé.",
  },
  {
    icon: CheckCircle,
    title: 'Validation des Acquis',
    description: "Testez vos connaissances avec des projets finaux et obtenez une certification pour valider vos nouvelles compétences.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="flex-1 bg-muted/20">
      <section className="w-full py-12 md:py-20 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">La compétence par la pratique.</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Git Explorer est conçu autour d'un principe simple : la meilleure façon d'apprendre est de pratiquer. Découvrez les fonctionnalités qui rendent notre approche unique.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

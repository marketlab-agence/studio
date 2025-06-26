import { Button } from '@/components/ui/button';
import { GitCommitHorizontal, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Tutoriel Interactif</div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Maîtrisez Git & GitHub
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Apprenez le contrôle de version de manière amusante et interactive avec des exercices pratiques,
                des quiz et des visualisations.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/tutorial">
                <Button size="lg">
                  Commencer le Tutoriel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  Voir mon Tableau de Bord
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

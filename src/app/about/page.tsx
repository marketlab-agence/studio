import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'À Propos - Git Explorer',
  description: 'Découvrez notre mission : rendre l\'apprentissage de Git et GitHub accessible, pratique et amusant pour tous.',
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Notre Mission : Démystifier Git
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed">
                Le contrôle de version est l'une des compétences les plus fondamentales pour un développeur moderne, mais son apprentissage peut être intimidant. Les concepts abstraits comme les branches, les fusions et les dépôts distants sont souvent difficiles à saisir à travers de simples lectures.
              </p>
              <p className="text-muted-foreground md:text-xl/relaxed">
                C'est pourquoi nous avons créé **Git Explorer**. Notre conviction est que la meilleure façon d'apprendre des outils pratiques est de les pratiquer. Nous avons conçu une plateforme qui vous plonge dans un environnement simulé, où vous pouvez faire des erreurs, expérimenter et construire une véritable "mémoire musculaire" sans la peur de casser un vrai projet.
              </p>
              <p className="text-muted-foreground md:text-xl/relaxed">
                Nous voulons transformer l'apprentissage de Git d'une corvée en une aventure interactive et gratifiante.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="https://placehold.co/600x400.png"
                width={600}
                height={400}
                alt="Une image représentant la collaboration et la technologie"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                data-ai-hint="collaboration technology"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

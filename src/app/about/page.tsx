import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'À Propos - Katalyst',
  description: 'Notre mission : accélérer votre maîtrise des outils professionnels grâce à une pédagogie basée sur la pratique.',
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Notre Mission : Accélérer votre Maîtrise.
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed">
                Dans le monde de la technologie, savoir n'est pas suffisant. Il faut savoir *faire*. Pourtant, la plupart des formations s'arrêtent à la théorie, vous laissant face à un fossé entre ce que vous avez appris et ce que vous devez accomplir.
              </p>
              <p className="text-muted-foreground md:text-xl/relaxed">
                **Katalyst** a été créé pour combler ce fossé. Nous croyons que la compétence naît de la pratique délibérée. C'est pourquoi nous avons développé une plateforme d'apprentissage unique qui vous plonge dans des environnements simulés et des scénarios réels. Vous ne vous contentez pas de regarder, vous manipulez. Vous ne vous contentez pas de lire, vous construisez.
              </p>
              <p className="text-muted-foreground md:text-xl/relaxed">
                Notre objectif est de transformer la manière dont vous apprenez les outils professionnels, en passant d'une assimilation passive à une acquisition active de compétences. Pour que vous soyez non seulement prêt, mais véritablement opérationnel.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="https://placehold.co/600x400.png"
                width={600}
                height={400}
                alt="Une image représentant la technologie et l'apprentissage"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                data-ai-hint="technology learning"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

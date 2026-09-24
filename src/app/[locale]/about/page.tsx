import { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'À Propos - Katalyst',
  description: 'Notre mission : accélérer votre maîtrise des outils professionnels grâce à une pédagogie basée sur la pratique.',
};

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('title')}
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed">
                {t('paragraph1')}
              </p>
              <p className="text-muted-foreground md:text-xl/relaxed">
                {t('paragraph2')}
              </p>
              <p className="text-muted-foreground md:text-xl/relaxed">
                {t('paragraph3')}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="https://placehold.co/600x400.png"
                width={600}
                height={400}
                alt={t('imageAlt')}
                className="mx-auto aspect-[3/2] overflow-hidden rounded-xl object-cover"
                data-ai-hint="technology learning"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

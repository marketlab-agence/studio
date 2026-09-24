import { Metadata } from 'next';
import { Terminal, MousePointerClick, BrainCircuit, Bot, AreaChart, CheckCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Fonctionnalités - Katalyst',
  description: 'Découvrez les outils interactifs qui font de Katalyst la meilleure plateforme pour maîtriser les outils professionnels.',
};

const features = [
  { icon: MousePointerClick, key: 'interactiveSimulations' },
  { icon: Terminal, key: 'safeEnvironments' },
  { icon: BrainCircuit, key: 'clearVisualizations' },
  { icon: Bot, key: 'aiHelp' },
  { icon: AreaChart, key: 'skillTracking' },
  { icon: CheckCircle, key: 'validation' },
];

export default async function FeaturesPage() {
  const t = await getTranslations('features');

  return (
    <main className="flex-1 bg-muted/20">
      <section className="w-full py-12 md:py-20 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t('title')}</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('intro')}
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
                  <CardTitle className="text-lg">{t(`items.${feature.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t(`items.${feature.key}.description`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

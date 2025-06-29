import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS_DATA } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Tarifs - Katalyst',
  description: 'Choisissez le plan qui correspond à vos ambitions. Passez au Premium pour un accès illimité.',
};

export default function PricingPage() {
    const freePlan = PLANS_DATA.free;
    const premiumPlan = PLANS_DATA.premium;

  return (
    <main className="flex-1 bg-muted/20">
      <section className="w-full py-12 md:py-20 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="outline">Nos Formules</Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Un tarif simple et transparent.</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Débloquez tout le potentiel de Katalyst et accélérez votre carrière.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-4xl items-start gap-8 py-12 md:grid-cols-2">
            
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-xl">{freePlan.name}</CardTitle>
                <CardDescription>{freePlan.description}</CardDescription>
                <div className="pt-4">
                    <span className="text-4xl font-bold">0€</span>
                    <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        <span>Accès au premier chapitre de chaque cours</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        <span>Quiz de fin de chapitre</span>
                    </li>
                </ul>
              </CardContent>
              <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Commencer gratuitement</Link>
                  </Button>
              </CardFooter>
            </Card>

            <Card className={cn(
                "flex flex-col h-full border-2 border-primary shadow-2xl shadow-primary/10",
                premiumPlan.recommended && "relative"
            )}>
                 {premiumPlan.recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Recommandé</Badge>
                )}
              <CardHeader>
                <CardTitle className="text-xl">{premiumPlan.name}</CardTitle>
                <CardDescription>{premiumPlan.description}</CardDescription>
                <div className="pt-4">
                    <span className="text-4xl font-bold">{premiumPlan.price}€</span>
                    <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                 <ul className="space-y-3">
                    <li className="flex items-center gap-2 font-semibold">
                        <Check className="h-5 w-5 text-primary" />
                        <span>Toutes les fonctionnalités gratuites, et :</span>
                    </li>
                    <li className="flex items-center gap-2 pl-7">
                        <Check className="h-5 w-5 text-primary" />
                        <span>Accès à toutes les formations actuelles et futures</span>
                    </li>
                    <li className="flex items-center gap-2 pl-7">
                        <Check className="h-5 w-5 text-primary" />
                        <span>Playground avec IA pour conseils et astuces</span>
                    </li>
                    <li className="flex items-center gap-2 pl-7">
                        <Check className="h-5 w-5 text-primary" />
                        <span>Certificat de réussite à la fin des formations</span>
                    </li>
                     <li className="flex items-center gap-2 pl-7">
                        <Check className="h-5 w-5 text-primary" />
                        <span>Support prioritaire</span>
                    </li>
                </ul>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" size="lg" asChild>
                    <Link href="/login">
                        <Sparkles className="mr-2 h-5 w-5"/>
                        {premiumPlan.cta}
                    </Link>
                </Button>
              </CardFooter>
            </Card>

          </div>
        </div>
      </section>
    </main>
  );
}

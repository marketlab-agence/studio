
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS_DATA } from '@/lib/plans';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function PricingPage() {
    const { user, loading, plan, updateUserPlan } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        document.title = 'Tarifs - Katalyst';
    }, []);

    const freePlan = PLANS_DATA.free;
    const premiumPlan = PLANS_DATA.premium;
    
    const handleDowngrade = () => {
        if (updateUserPlan) {
            updateUserPlan('Gratuit');
            toast({
                title: 'Changement de formule confirmé',
                description: 'Votre abonnement a été annulé. Vous ne serez plus facturé à la prochaine échéance.',
            });
        }
    };
    
    if (loading) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>Chargement...</span>
                </div>
            </main>
        );
    }

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
                 {
                    !user ? (
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">Commencer gratuitement</Link>
                        </Button>
                    ) : plan === 'Gratuit' ? (
                        <Button variant="outline" className="w-full" disabled>
                            Votre formule actuelle
                        </Button>
                    ) : ( // User is Premium
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Passer à la formule Gratuite
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Voulez-vous vraiment changer de formule ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Votre abonnement Premium sera annulé. Vous ne serez plus facturé et vous perdrez l'accès aux fonctionnalités Premium à la fin de votre période de facturation actuelle. Êtes-vous sûr de vouloir continuer ?
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDowngrade}>Confirmer le passage en Gratuit</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )
                 }
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
                 {
                    !user ? (
                        <Button className="w-full" size="lg" asChild>
                            <Link href="/login?redirect=/subscribe">
                                <Sparkles className="mr-2 h-5 w-5"/>
                                Passer au Premium
                            </Link>
                        </Button>
                    ) : plan === 'Premium' ? (
                        <Button className="w-full" size="lg" disabled>
                            Votre formule actuelle
                        </Button>
                    ) : ( // User is Free
                        <Button className="w-full" size="lg" asChild>
                             <Link href="/subscribe">
                                <Sparkles className="mr-2 h-5 w-5"/>
                                Mettre à niveau
                            </Link>
                        </Button>
                    )
                 }
              </CardFooter>
            </Card>

          </div>
        </div>
      </section>
    </main>
  );
}

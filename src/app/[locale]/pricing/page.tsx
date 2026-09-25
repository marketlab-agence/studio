
'use client';

import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
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
import { getPlansAction } from '@/actions/planActions';
import type { SubscriptionPlan } from '@/types/plans.types';

export default function PricingPage() {
  const format = useFormatter();
    const t = useTranslations('pricing');
    const tc = useTranslations('common');
    const { user, loading, userPlan, updateUserPlan } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);

    useEffect(() => {
        document.title = t('documentTitle');
        async function fetchPlans() {
            setPlansLoading(true);
            try {
                const fetchedPlans = await getPlansAction();
                setPlans(fetchedPlans);
            } catch (error) {
                console.error("Failed to fetch plans:", error);
                toast({ title: t('errorTitle'), description: t('errorLoad'), variant: 'destructive'});
            } finally {
                setPlansLoading(false);
            }
        }
        fetchPlans();
    }, [toast, t]);

    const handleDowngrade = () => {
        if (updateUserPlan) {
            updateUserPlan('free');
            toast({
                title: t('downgradeTitle'),
                description: t('downgradeDescription'),
            });
        }
    };
    
    if (loading || plansLoading) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>{t('loading')}</span>
                </div>
            </main>
        );
    }
    
    const freePlan = plans.find(p => p.id === 'free');
    const premiumPlan = plans.find(p => p.id === 'premium');

    return (
    <main className="flex-1 bg-muted/20">
      <section className="w-full py-12 md:py-20 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="outline">{t('badge')}</Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t('title')}</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t('subtitle')}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-4xl items-start gap-8 py-12 md:grid-cols-2">
            
            {freePlan && (
                <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="text-xl">{freePlan.name}</CardTitle>
                    <CardDescription>{freePlan.description}</CardDescription>
                    <div className="pt-4">
                        <span className="text-4xl font-bold">{freePlan.price > 0 ? `${freePlan.price}€` : '0€'}</span>
                        <span className="text-muted-foreground">{t('perMonth')}</span>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <ul className="space-y-3">
                        {freePlan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-primary" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    {
                        !user ? (
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/login">{t('startFree')}</Link>
                            </Button>
                        ) : userPlan?.id === 'free' ? (
                            <Button variant="outline" className="w-full" disabled>
                                {t('currentPlan')}
                            </Button>
                        ) : ( // User is Premium
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        {t('switchToFree')}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>{t('confirmSwitchTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('confirmSwitchDescription')}
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDowngrade}>{t('confirmSwitchAction')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )
                    }
                </CardFooter>
                </Card>
            )}

            {premiumPlan && (
                <Card className={cn(
                    "flex flex-col h-full border-2 border-primary shadow-2xl shadow-primary/10",
                    premiumPlan.recommended && "relative"
                )}>
                    {premiumPlan.recommended && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{t('recommended')}</Badge>
                    )}
                <CardHeader>
                    <CardTitle className="text-xl">{premiumPlan.name}</CardTitle>
                    <CardDescription>{premiumPlan.description}</CardDescription>
                    <div className="pt-4">
                          {/*
                            ⚠️ La devise reste l'euro — seule sa PRÉSENTATION suit la
                            locale (`1 234,56 €` en français, `€1,234.56` en anglais).
                            Changer de devise serait une décision commerciale, hors
                            périmètre de l'internationalisation.
                          */}
                          <span className="text-4xl font-bold">{format.number(premiumPlan.price, { style: 'currency', currency: 'EUR' })}</span>
                        <span className="text-muted-foreground">{t('perMonth')}</span>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2 font-semibold">
                            <Check className="h-5 w-5 text-primary" />
                            <span>{t('allFreeFeatures')}</span>
                        </li>
                        {premiumPlan.features.map((feature, i) => (
                             <li key={i} className="flex items-center gap-2 pl-7">
                                <Check className="h-5 w-5 text-primary" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    {
                        !user ? (
                            <Button className="w-full" size="lg" asChild>
                                <Link href="/login?redirect=/subscribe">
                                    <Sparkles className="mr-2 h-5 w-5"/>
                                    {t('goPremium')}
                                </Link>
                            </Button>
                        ) : userPlan?.id === 'premium' ? (
                            <Button className="w-full" size="lg" disabled>
                                {t('currentPlan')}
                            </Button>
                        ) : ( // User is Free
                            <Button className="w-full" size="lg" asChild>
                                <Link href="/subscribe">
                                    <Sparkles className="mr-2 h-5 w-5"/>
                                    {t('upgrade')}
                                </Link>
                            </Button>
                        )
                    }
                </CardFooter>
                </Card>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}

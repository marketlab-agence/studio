
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PLANS_DATA } from '@/lib/plans';

export default function SubscribePage() {
  const router = useRouter();
  const { user, loading, isPremium, updateUserPlan } = useAuth();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const premiumPlan = PLANS_DATA.premium;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/subscribe');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (!loading && isPremium) {
      router.push('/dashboard');
    }
  }, [isPremium, loading, router]);

  const handleSubscribe = () => {
    setIsSubscribing(true);
    // Simulate API call to payment provider
    setTimeout(() => {
        if (updateUserPlan) {
            updateUserPlan('Premium');
        }
        toast({
            title: "Félicitations et bienvenue !",
            description: "Votre abonnement Premium est maintenant actif.",
        });
        // Redirect to the AI assistant page as a reward
        router.push('/ai-assistant');
    }, 2000);
  };

  if (loading || !user || isPremium) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Chargement de votre session...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-lg space-y-8">
            <div className="text-center">
                 <h1 className="text-3xl font-bold tracking-tight">Finalisez votre abonnement</h1>
                 <p className="text-muted-foreground mt-2">Vous êtes sur le point de débloquer le plein potentiel de Katalyst.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow-400" /> {premiumPlan.name}</CardTitle>
                            <CardDescription className="mt-1">{premiumPlan.description}</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-bold">{premiumPlan.price}€</p>
                            <p className="text-xs text-muted-foreground">/ mois</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="font-semibold text-sm">Ce qui est inclus :</p>
                    <ul className="space-y-3">
                        {premiumPlan.features.map((feature, i) => (
                             <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 text-primary" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSubscribe} disabled={isSubscribing} className="w-full" size="lg">
                        {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4" />}
                        {isSubscribing ? "Traitement en cours..." : "Confirmer et Payer (Simulation)"}
                    </Button>
                </CardFooter>
            </Card>
            <p className="text-xs text-center text-muted-foreground">
              Ceci est une simulation. Aucune information de paiement n'est requise.
            </p>
        </div>
    </main>
  );
}

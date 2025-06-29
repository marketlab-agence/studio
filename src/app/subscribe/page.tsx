
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

  const handleSubscribe = async () => {
    setIsSubscribing(true);

    // --- LOGIQUE DE PAIEMENT POUR LA PRODUCTION ---
    // Le code ci-dessous est un guide pour intégrer un système de paiement réel comme Stripe.
    // Vous auriez besoin d'un backend pour gérer la création de la session de paiement de manière sécurisée.

    // ÉTAPE 1: Appeler votre backend pour créer une session de paiement.
    // Cette fonction (à créer) communiquerait avec votre serveur.
    // Exemple :
    // try {
    //   const response = await fetch('/api/create-checkout-session', { 
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ planId: 'premium' }) // Envoyez l'ID du plan ou le prix
    //   });
    //   const { sessionId } = await response.json();
    //
    //   // ÉTAPE 2: Rediriger l'utilisateur vers la page de paiement de Stripe.
    //   // Vous utiliseriez le SDK Stripe.js pour cela.
    //   const stripe = await getStripe(); // Fonction utilitaire pour charger Stripe.js
    //   const { error } = await stripe.redirectToCheckout({ sessionId });
    //
    //   if (error) {
    //     console.error(error);
    //     toast({ title: 'Erreur', description: 'Impossible de rediriger vers la page de paiement.', variant: 'destructive' });
    //     setIsSubscribing(false);
    //   }
    // } catch (error) {
    //     console.error("Failed to create checkout session:", error);
    //     toast({ title: 'Erreur de serveur', description: 'Impossible de lancer le processus de paiement.', variant: 'destructive' });
    //     setIsSubscribing(false);
    // }
    //
    // L'ÉTAPE 3 (non visible ici) serait sur votre backend : un "webhook" écoute la confirmation de paiement de Stripe
    // pour mettre à jour le statut de l'utilisateur dans votre base de données.

    // --- SIMULATION ACTUELLE (à remplacer par la logique de production) ---
    setTimeout(() => {
        if (updateUserPlan) {
            updateUserPlan('Premium');
        }
        toast({
            title: "Félicitations et bienvenue !",
            description: "Votre abonnement Premium est maintenant actif.",
        });
        router.push('/ai-assistant');
    }, 2000);
    // --- FIN DE LA SIMULATION ---
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
                        {isSubscribing ? "Redirection..." : "S'abonner et Payer"}
                    </Button>
                </CardFooter>
            </Card>
            <p className="text-xs text-center text-muted-foreground">
              Paiement sécurisé. Vous allez être redirigé vers notre partenaire de paiement.
            </p>
        </div>
    </main>
  );
}

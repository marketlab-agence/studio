
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    signInWithPopup,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon, GithubIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFirebaseConfigured = !!auth;

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, searchParams]);

  const handleOAuthSignIn = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    if (!isFirebaseConfigured) {
      toast({
        variant: 'destructive',
        title: 'Configuration requise',
        description: "L'authentification est désactivée. L'administrateur doit configurer Firebase pour activer la connexion.",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Connexion réussie', description: 'Bienvenue !' });
      // Redirection is handled by useEffect
    } catch (error: any) {
      console.error('LoginPage: OAuth signin error:', error);
      
      let errorMessage = "Une erreur inconnue est survenue. Veuillez réessayer.";
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        setIsSubmitting(false);
        return; 
      } else if (error?.code === 'auth/network-request-failed') {
          errorMessage = 'La requête réseau a échoué. Vérifiez votre connexion internet. Il est aussi possible que le domaine de cette application ne soit pas autorisé dans votre console Firebase.';
      } else if (error?.code === 'auth/popup-blocked') {
        errorMessage = 'La popup a été bloquée par votre navigateur. Veuillez autoriser les popups pour ce site et réessayer.';
      } else if (error?.code === 'auth/unauthorized-domain') {
        errorMessage = 'Ce domaine n\'est pas autorisé pour l\'authentification OAuth. Contactez l\'administrateur.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: errorMessage,
      });

      setIsSubmitting(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
        toast({
            variant: 'destructive',
            title: 'Configuration requise',
            description: "L'authentification est désactivée. L'administrateur doit configurer Firebase pour activer la connexion.",
        });
        return;
    }
    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: 'Inscription réussie', description: 'Vous êtes maintenant connecté.' });
      // Redirection is handled by the useEffect hook
    } catch (error: any) {
        let description = "Une erreur est survenue. Veuillez réessayer.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Cette adresse e-mail est déjà utilisée par un autre compte.";
        } else if (error.code === 'auth/weak-password') {
            description = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
        } else if (error.code === 'auth/network-request-failed') {
          description = "La requête réseau a échoué. Assurez-vous d'être connecté à internet et que le domaine est bien autorisé dans votre console Firebase.";
        } else if (error.message) {
            description = error.message;
        }
        toast({ variant: 'destructive', title: 'Erreur d\'inscription', description });
        setIsSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
        toast({
            variant: 'destructive',
            title: 'Configuration requise',
            description: "L'authentification est désactivée. L'administrateur doit configurer Firebase pour activer la connexion.",
        });
        return;
    }
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Connexion réussie', description: 'Bienvenue !' });
      // Redirection is handled by the useEffect hook
    } catch (error: any) {
        let description = "Adresse e-mail ou mot de passe incorrect.";
        if (error.code === 'auth/network-request-failed') {
            description = "La requête réseau a échoué. Assurez-vous d'être connecté à internet et que le domaine est bien autorisé dans votre console Firebase.";
        }
        toast({ variant: 'destructive', title: 'Erreur de connexion', description });
        setIsSubmitting(false);
    }
  };

  if (authLoading || user) {
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
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Se connecter</TabsTrigger>
          <TabsTrigger value="signup">S'inscrire</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Bienvenue</CardTitle>
              <CardDescription>Connectez-vous pour accéder à votre tableau de bord.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleOAuthSignIn(new GoogleAuthProvider())} disabled={isSubmitting}>
                  <GoogleIcon className="mr-2 h-4 w-4" /> Google
                </Button>
                <Button variant="outline" onClick={() => handleOAuthSignIn(new GithubAuthProvider())} disabled={isSubmitting}>
                  <GithubIcon className="mr-2 h-4 w-4" /> GitHub
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou continuez avec</span>
                </div>
              </div>
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Mot de passe</Label>
                  <Input id="password-signin" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Se connecter'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Créer un compte</CardTitle>
              <CardDescription>Entrez vos informations pour commencer votre apprentissage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleOAuthSignIn(new GoogleAuthProvider())} disabled={isSubmitting}>
                        <GoogleIcon className="mr-2 h-4 w-4" /> Google
                    </Button>
                    <Button variant="outline" onClick={() => handleOAuthSignIn(new GithubAuthProvider())} disabled={isSubmitting}>
                        <GithubIcon className="mr-2 h-4 w-4" /> GitHub
                    </Button>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Ou inscrivez-vous avec votre email</span>
                    </div>
                </div>
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">Email</Label>
                      <Input id="email-signup" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup">Mot de passe</Label>
                      <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Créer mon compte'}
                    </Button>
                </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

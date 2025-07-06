
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
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon, GithubIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, searchParams]);

  const handleOAuthSignIn = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    setIsSubmitting(true);
    try {
      if (!auth) throw new Error("L'authentification Firebase n'est pas configurée. Veuillez vérifier les variables d'environnement.");
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!auth) {
      toast({ variant: 'destructive', title: 'Erreur de configuration', description: "L'authentification Firebase n'est pas configurée." });
      setIsSubmitting(false);
      return;
    }

    try {
      // First, try to sign in
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Connexion réussie', description: 'Bienvenue !' });
    } catch (signInError: any) {
      // If user does not exist or password is wrong, try to create an account
      if (signInError.code === 'auth/invalid-credential') {
        try {
          // Try to create an account
          await createUserWithEmailAndPassword(auth, email, password);
          toast({ title: 'Compte créé avec succès', description: 'Bienvenue !' });
        } catch (signUpError: any) {
          // If sign up fails because email is in use, it means the password was wrong for sign in
          if (signUpError.code === 'auth/email-already-in-use') {
            toast({ variant: 'destructive', title: 'Erreur de connexion', description: "Le mot de passe est incorrect. Veuillez réessayer." });
          } else if (signUpError.code === 'auth/weak-password') {
            toast({ variant: 'destructive', title: 'Erreur d\'inscription', description: "Le mot de passe est trop faible (6 caractères minimum)." });
          } else {
            toast({ variant: 'destructive', title: 'Erreur', description: signUpError.message });
          }
        }
      } else { // Handle other sign-in errors
        let description = "Une erreur est survenue. Veuillez réessayer.";
        if (signInError.code === 'auth/network-request-failed') {
          description = "La requête réseau a échoué. Vérifiez votre connexion internet.";
        }
        toast({ variant: 'destructive', title: 'Erreur de connexion', description });
      }
    } finally {
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Bienvenue</CardTitle>
          <CardDescription>Connectez-vous ou créez un compte pour continuer.</CardDescription>
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
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Continuer avec votre Email'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

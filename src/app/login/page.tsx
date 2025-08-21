
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
    GoogleAuthProvider, 
    GithubAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon, GithubIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { AppUser } from '@/lib/users';


// Helper to create a user document in Firestore if it doesn't exist
const createUserDocumentFromOAuth = async (user: User) => {
    if (!db) return;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const newUser: Omit<AppUser, 'id'> = {
            name: user.displayName || user.email || 'Utilisateur Anonyme',
            email: user.email!,
            planId: 'free',
            status: 'Actif',
            role: 'Utilisateur',
            joined: new Date().toISOString().split('T')[0],
            phone: user.phoneNumber || '',
        };
        try {
            await setDoc(userDocRef, newUser);
            console.log("User document created from OAuth for UID:", user.uid);
        } catch (error) {
            console.error("Error creating user document from OAuth:", error);
        }
    }
}


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
      const result = await signInWithPopup(auth, provider);
      
      await createUserDocumentFromOAuth(result.user);
      
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
        errorMessage = "Ce domaine n'est pas autorisé pour l'authentification OAuth. Contactez l'administrateur.";
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
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Connexion réussie', description: 'Bienvenue !' });
      // Redirection will be handled by the useEffect hook watching the user state.
    } catch (signInError: any) {
      let description = "Une erreur est survenue. Veuillez réessayer.";
      if (signInError.code === 'auth/invalid-credential') {
        description = "Email ou mot de passe incorrect. Veuillez réessayer.";
      } else if (signInError.code === 'auth/user-disabled') {
          description = "Votre compte a été désactivé. Veuillez contacter l'administrateur.";
      } else if (signInError.code === 'auth/network-request-failed') {
          description = "La requête réseau a échoué. Vérifiez votre connexion internet.";
      }
      toast({ variant: 'destructive', title: 'Erreur de connexion', description });
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
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Se connecter'}
            </Button>
          </form>
          <div className="text-center text-sm">
            Vous n'avez pas de compte ? <Link href="/signup" className="underline">Inscrivez-vous</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

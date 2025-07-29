
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!auth) {
      toast({ variant: 'destructive', title: 'Erreur de configuration', description: "L'authentification Firebase n'est pas configurée." });
      setIsSubmitting(false);
      return;
    }

    if (!displayName.trim()) {
        toast({ variant: 'destructive', title: 'Erreur d'inscription', description: "Veuillez entrer un nom à afficher." });
        setIsSubmitting(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
          displayName: displayName.trim()
      });

      // TODO: Send email verification email
      // await sendEmailVerification(userCredential.user);

      toast({ title: 'Compte créé avec succès', description: 'Bienvenue ! Veuillez vérifier votre email.' });
      router.push('/dashboard'); // Redirect to dashboard or a verification pending page

    } catch (error: any) {
      console.error('SignupPage: Signup error:', error);
      let description = "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";

      if (error.code === 'auth/email-already-in-use') {
        description = "Cet email est déjà utilisé. Veuillez vous connecter.";
      } else if (error.code === 'auth/weak-password') {
        description = "Le mot de passe est trop faible (6 caractères minimum).";
      } else if (error.code === 'auth/invalid-email') {
          description = "L'adresse email n'est pas valide.";
      }

      toast({ variant: 'destructive', title: 'Erreur d'inscription', description });

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>Entrez vos informations ci-dessous pour créer votre compte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom à afficher</Label>
              <Input id="displayName" type="text" placeholder="Votre Nom" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Créer un compte'}
            </Button>
          </form>
          <div className="text-center text-sm">
            Vous avez déjà un compte ? <Link href="/login" className="underline">Connectez-vous</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
